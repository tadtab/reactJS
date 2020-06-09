'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var toString = Object.prototype.toString;
var is = function is(typeName, x) {
  return toString.call(x) === '[object ' + typeName + ']';
};
var isArray = is.bind(null, 'Array');
var isObject = is.bind(null, 'Object');
var isNumber = is.bind(null, 'Number');
var isFunction = is.bind(null, 'Function');
var isBoolean = is.bind(null, 'Boolean');
var isString = is.bind(null, 'String');
var isNull = is.bind(null, 'Null');
var isUndefined = is.bind(null, 'Undefined');
var existy = function existy(x) {
  return !isNull(x) && !isUndefined(x);
};
var values = function values(obj) {
  return Object.keys(obj).reduce(function (vals, key) {
    return vals.concat(obj[key]);
  }, []);
};

var makeRequirable = function makeRequirable(type) {
  return Object.assign(type, {
    isRequired: {
      isRequiring: true,
      next: type,
      validate: function validate(x) {
        return existy(x);
      },
      makeErrorMessage: function makeErrorMessage(ctx, x) {
        return ctx.prop + ' must not be null or undefined';
      },
      toJSON: function toJSON() {
        return Object.assign({ required: true }, type.toJSON());
      }
    }
  });
};

// return "type" object for validation.. used for testing schema's as standalone props
var asType = function asType(obj) {
  if (obj.validate) return obj;

  var type = {
    validate: function validate(x) {
      return !_validate(obj, x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should match schema: ' + type.toJSON();
    },
    toJSON: function toJSON() {
      return JSON.stringify(obj);
    }
  };

  return type;
};

var types = exports.types = {

  string: makeRequirable({
    validate: function validate(x) {
      return isString(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be of type: string';
    },
    toJSON: function toJSON() {
      return { type: 'string' };
    }
  }),

  number: makeRequirable({
    validate: function validate(x) {
      return isNumber(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be of type: number';
    },
    toJSON: function toJSON() {
      return { type: 'number' };
    }
  }),

  bool: makeRequirable({
    validate: function validate(x) {
      return isBoolean(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be of type: bool';
    },
    toJSON: function toJSON() {
      return { type: 'bool' };
    }
  }),

  object: makeRequirable({
    validate: function validate(x) {
      return isObject(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be of type: object';
    },
    toJSON: function toJSON() {
      return { type: 'object' };
    }
  }),

  array: makeRequirable({
    validate: function validate(x) {
      return isArray(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be of type: array';
    },
    toJSON: function toJSON() {
      return { type: 'array' };
    }
  }),

  func: makeRequirable({
    validate: function validate(x) {
      return isFunction(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be of type: func';
    },
    toJSON: function toJSON() {
      return { type: 'func' };
    }
  }),

  oneOf: function oneOf() {
    var possibilities = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    var type = makeRequirable({
      validate: function validate(x) {
        return possibilities.indexOf(x) > -1;
      },
      makeErrorMessage: function makeErrorMessage(ctx, x) {
        return type.toJSON();
      },
      toJSON: function toJSON() {
        return { oneOf: possibilities };
      }
    });

    return type;
  },
  oneOfType: function oneOfType() {
    var schemaOrTypes = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    var subs = schemaOrTypes.map(asType);

    var type = makeRequirable({
      validate: function validate(x) {
        return subs.some(function (sub) {
          return sub.validate(x);
        });
      },
      makeErrorMessage: function makeErrorMessage(ctx, x) {
        return type.toJSON();
      },
      toJSON: function toJSON() {
        return { oneOfType: schemaOrTypes.map(function (st) {
            return st.toJSON();
          }) };
      }
    });

    return type;
  },
  arrayOf: function arrayOf() {
    var schemaOrType = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var sub = asType(schemaOrType);

    var type = makeRequirable({
      validate: function validate(x) {
        return x.every(function (y) {
          return sub.validate(y);
        });
      },
      makeErrorMessage: function makeErrorMessage() {
        return type.toJSON();
      },
      toJSON: function toJSON() {
        return { arrayOf: sub.toJSON() };
      }
    });

    return type;
  },
  objectOf: function objectOf() {
    var schemaOrType = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var sub = asType(schemaOrType);

    var type = makeRequirable({
      validate: function validate(x) {
        return values(x).every(function (y) {
          return sub.validate(y);
        });
      },
      makeErrorMessage: function makeErrorMessage(ctx, x) {
        return type.toJSON();
      },
      toJSON: function toJSON() {
        return { objectOf: sub.toJSON() };
      }
    });

    return type;
  },
  instanceOf: function instanceOf() {
    var Constructor = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

    var type = makeRequirable({
      validate: function validate(x) {
        return x instanceof Constructor;
      },
      makeErrorMessage: function makeErrorMessage(ctx, x) {
        return ctx.prop + ' should be an instance of ' + type.toJSON();
      },
      toJSON: function toJSON() {
        return Constructor.toString();
      }
    });

    return type;
  },
  shape: function shape() {
    var schema = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var type = makeRequirable({
      validate: function validate(x) {
        return !_validate(schema, x);
      },
      makeErrorMessage: function makeErrorMessage(ctx) {
        var x = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        return Object.keys(schema).reduce(function (memo, key) {
          var result = _validate(_defineProperty({}, key, schema[key]), _defineProperty({}, key, x[key]));
          if (!result) return memo;
          return Object.assign({}, memo, result);
        }, {});
      },
      toJSON: function toJSON() {
        return Object.keys(schema).reduce(function (memo, key) {
          return Object.assign({}, memo, _defineProperty({}, key, schema[key].toJSON()));
        }, {});
      }
    });

    return type;
  },
  custom: function custom() {
    var type = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var errors = _validate({
      validate: types.func.isRequired,
      makeErrorMessage: types.func.isRequired,
      toJSON: types.func
    }, type);
    if (errors) throw new Error(errors);
    return makeRequirable(Object.assign({ toJSON: function toJSON() {
        return 'custom type - define a "toJSON" function for a better message here';
      } }, type));
  },

  any: makeRequirable({
    validate: function validate(x) {
      return existy(x);
    },
    makeErrorMessage: function makeErrorMessage(ctx, x) {
      return ctx.prop + ' should be "any"thing... just not undefined or null';
    }
  })
};

var validateType = function validateType(errors, ctx, type, val, key) {
  if (!existy(val) && !type.isRequiring) return errors;
  var passed = type.validate(val);
  return passed ? errors : Object.assign({}, errors, _defineProperty({}, key, type.makeErrorMessage(ctx, val)));
};

var _validate = function _validate(schema, obj) {
  var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var errors = Object.keys(schema).reduce(function (errors, key) {
    var ctx = { prop: key };
    var type = schema[key];
    if (opts.failFast && Object.keys(errors).length) return errors;
    var newErrors = validateType(errors, ctx, type, obj[key], key);
    if (opts.failFast && Object.keys(newErrors).length) return newErrors;
    while (type.next) {
      type = type.next;
      newErrors = validateType(newErrors, ctx, type, obj[key], key);
    }
    return newErrors;
  }, {});

  return Object.keys(errors).length ? errors : null;
};

exports.validate = _validate;
var enforce = exports.enforce = function enforce(schema, obj, opts) {
  var errors = _validate(schema, obj, opts);
  if (errors) return new Error(JSON.stringify(errors));
  return obj;
};
