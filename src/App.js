import React, { Component } from 'react';
import classes from './App.module.css';
import Person from './Person/Person';
class App extends Component {
  state = {
    persons: [
      {id: "1", name: "Tadele", age: "30"},
      {id: "2", name: "Unknown", age: "45"},
      {id: "3", name: "ThirdPerson", age: "67"}
    ], 
    sampleText: "This is extra", 
    displayPersonList: false
  }

  

  deletePersonHandler = (index) => {
    const persons = [...this.state.persons];
    persons.splice(index, 1)
    this.setState({
      persons: persons
    })
  }
  
  nameChangedHandler = (event, id) =>{
    const personIndex = this.state.persons.findIndex(person => {
        return person.id == id
    })
    const person = {...this.state.persons[personIndex]};
    person.name = event.target.value;

    const persons = [...this.state.persons];
    persons[personIndex] = person; 

    this.setState({
      persons: persons
    })
  }

  manipulateDisplay = () => {
    const isDisplay = this.state.displayPersonList;
    this.setState({
      displayPersonList: !isDisplay
    })
  }

  render() {

  
    let persons = null; 

    const btnClasses = [classes.Button];

    if(this.state.displayPersonList){
      persons = (<div>
        {this.state.persons.map((person, index) => {
          return (<Person 
                    click={() => this.deletePersonHandler(index)} 
                    changed={(event) => {this.nameChangedHandler(event, person.id)}}
                    name={person.name} 
                    age={person.age} 
                    key={person.id}
                    />);
        })}
        
      </div>);
      btnClasses.push(classes.Red)
    }

    const classesArray = [];

    if(this.state.persons.length <= 3){
      classesArray.push('red');
    }
    if(this.state.persons.length <= 1){
      classesArray.push('bold');
    }

    return (
     
    <div className={classes.App}>
      <h1>Hello I am react App</h1>
    <p className={classesArray.join(' ')}>Ready to toggle and length is {this.state.persons.length}</p>
      <button className={btnClasses.join(' ')} alt={this.state.displayPersonList} onClick={this.manipulateDisplay}>Switch Person Display</button>
      {persons}
    </div>
    
    );
    
    //return React.createElement("div", {className: "pp"}, React.createElement("h1", null, "Hello I am react App"))
      
  }
}

export default App;
