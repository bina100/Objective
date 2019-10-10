import React, {Component} from "react";
import './App.css';
import {render} from 'react-dom';
import { Link, Switch, Route} from 'react-router-dom';
import Login from './components/Login'
import BtnStudent from './components/BtnStudent';
import BtnGuide from './components/BtnGuide';
import BtnAdmin from './components/BtnAdmin';

//import {Redirect} from "./components/Redirect";

// Create the shared history
class App extends React.Component{

    render(){
        return(
           
                <Switch>
                    <Route exact path="/" component={Login}/>
                    <Route  path="/btnStudent" component={BtnStudent}/>
                    <Route  path="/btnGuide" component={BtnGuide}/>
                    <Route  path="/btnAdmin" component={BtnAdmin}/>

                </Switch>
          
          
        )
    }
}
const A =()=>{
    return(
        <div>
            <h1>this component A page </h1>
            <Link to="/b">B component</Link>
        </div>
    )
}
const B =()=>{
    return(
        <div className="App">
            <h1>hello</h1>
        </div>
    )
   
}


export default App;

// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href=""
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
