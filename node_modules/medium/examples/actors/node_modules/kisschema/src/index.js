
var toString = Object.prototype.toString
var is = (typeName, x) => toString.call(x) === `[object ${typeName}]`
var isArray = is.bind(null, 'Array')
var isObject = is.bind(null, 'Object')
var isNumber = is.bind(null, 'Number')
var isFunction = is.bind(null, 'Function')
var isBoolean = is.bind(null, 'Boolean')
var isString = is.bind(null, 'String')
var isNull = is.bind(null, 'Null')
var isUndefined = is.bind(null, 'Undefined')
var existy = (x) => !isNull(x) && !isUndefined(x)
var values = (obj) => Object.keys(obj).reduce((vals, key) => vals.concat(obj[key]), [])

var makeRequirable = (type) => {
  return Object.assign(type, {
    isRequired: {
      isRequiring: true,
      next: type,
      validate: (x) => existy(x),
      makeErrorMessage: (ctx, x) => `${ctx.prop} must not be null or undefined`,
      toJSON: () => Object.assign({ required: true }, type.toJSON())
    }
  })
}

// return "type" object for validation.. used for testing schema's as standalone props
var asType = (obj) => {
  if (obj.validate) return obj

  let type = {
    validate: (x) => !validate(obj, x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should match schema: ${type.toJSON()}`,
    toJSON: () => JSON.stringify(obj)
  }

  return type
}

export var types = {

  string: makeRequirable({
    validate: (x) => isString(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be of type: string`,
    toJSON: () => ({ type: 'string' })
  }),

  number: makeRequirable({
    validate: (x) => isNumber(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be of type: number`,
    toJSON: () => ({ type: 'number' })
  }),

  bool: makeRequirable({
    validate: (x) => isBoolean(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be of type: bool`,
    toJSON: () => ({ type: 'bool' })
  }),

  object: makeRequirable({
    validate: (x) => isObject(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be of type: object`,
    toJSON: () => ({ type: 'object' })
  }),

  array: makeRequirable({
    validate: (x) => isArray(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be of type: array`,
    toJSON: () => ({ type: 'array' })
  }),

  func: makeRequirable({
    validate: (x) => isFunction(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be of type: func`,
    toJSON: () => ({ type: 'func' })
  }),

  oneOf(possibilities=[]) {

    let type = makeRequirable({
      validate: (x) => possibilities.indexOf(x) > -1,
      makeErrorMessage: (ctx, x) => type.toJSON(),
      toJSON: () => ({ oneOf: possibilities })
    })

    return type
  },

  oneOfType(schemaOrTypes=[]) {

    var subs = schemaOrTypes.map(asType)

    let type = makeRequirable({
      validate: (x) => subs.some(sub => sub.validate(x)),
      makeErrorMessage: (ctx, x) => type.toJSON(),
      toJSON: () => ({ oneOfType: schemaOrTypes.map((st) => st.toJSON()) })
    })

    return type
  },

  arrayOf(schemaOrType={}) {
    var sub = asType(schemaOrType)

    let type = makeRequirable({
      validate: (x) => x.every((y) => sub.validate(y)),
      makeErrorMessage: () => type.toJSON(),
      toJSON: () => ({ arrayOf: sub.toJSON() })
    })

    return type
  },

  objectOf(schemaOrType={}) {

    let sub = asType(schemaOrType)

    let type = makeRequirable({
      validate: (x) => values(x).every((y) => sub.validate(y)),
      makeErrorMessage: (ctx, x) => type.toJSON(),
      toJSON: () => ({ objectOf: sub.toJSON() })
    })

    return type
  },

  instanceOf(Constructor=function() {}) {

    let type =  makeRequirable({
      validate: (x) => x instanceof Constructor,
      makeErrorMessage: (ctx, x) => `${ctx.prop} should be an instance of ${type.toJSON()}`,
      toJSON: () => Constructor.toString()
    })

    return type
  },

  shape(schema={}) {

    let type = makeRequirable({
      validate: (x) => !validate(schema, x),
      makeErrorMessage: (ctx, x={}) => {
        return Object.keys(schema).reduce((memo, key) => {
          let result = validate({ [key]: schema[key] }, { [key]: x[key] })
          if (!result) return memo
          return Object.assign({}, memo, result)
        }, {})
      },
      toJSON: () => Object.keys(schema).reduce((memo, key) => {
        return Object.assign({}, memo, { [key]: schema[key].toJSON() })
      }, {})
    })

    return type
  },

  custom(type={}) {
    var errors = validate({ 
      validate: types.func.isRequired, 
      makeErrorMessage: types.func.isRequired,
      toJSON: types.func
    }, type)
    if (errors) throw new Error(errors)
    return makeRequirable(Object.assign({ toJSON: () => 'custom type - define a "toJSON" function for a better message here' }, type))
  },

  any: makeRequirable({
    validate: (x) => existy(x),
    makeErrorMessage: (ctx, x) => `${ctx.prop} should be "any"thing... just not undefined or null`
  })
}

var validateType = (errors, ctx, type, val, key) => {
  if (!existy(val) && !type.isRequiring) return errors
  var passed = type.validate(val)
  return passed ? errors : Object.assign({}, errors, { [key]: type.makeErrorMessage(ctx, val) })
}

export var validate = (schema, obj, opts={}) => {

  var errors = Object.keys(schema).reduce((errors, key) => {
    var ctx = { prop: key }
    var type = schema[key]
    if (opts.failFast && Object.keys(errors).length) return errors
    var newErrors = validateType(errors, ctx, type, obj[key], key)
    if (opts.failFast && Object.keys(newErrors).length) return newErrors
    while (type.next) {
      type = type.next
      newErrors = validateType(newErrors, ctx, type, obj[key], key)
    }
    return newErrors
  }, {})

  return Object.keys(errors).length ? errors : null
}

export var enforce = (schema, obj, opts) => {
  let errors = validate(schema, obj, opts)
  if (errors) return new Error(JSON.stringify(errors))
  return obj
}
