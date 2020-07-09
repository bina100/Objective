import React, {Component} from "react";
import './App.css';
import { Link, Switch, Route} from 'react-router-dom';
import Login from './components/Login'
import BtnStudent from './components/BtnStudent';
import BtnGuide from './components/BtnGuide';
import BtnAdmin from './components/BtnAdmin';
import BtnDirector from './components/BtnDirector';

//TODO's:
/*
1. Routing should stay on reload.
2. Auth should be applyed to server and client.
3. Create tables.
4. Save students on server, by sending the file's rows.
5.  

*/



// Create the shared history
class App extends React.Component{

    render(){
        return(
           
                <Switch>
                    <Route exact path="/" component={Login}/>
                    <Route  path="/btnStudent" component={BtnStudent}/>
                    <Route  path="/btnGuide" component={BtnGuide}/>
                    <Route  path="/btnAdmin" component={BtnAdmin}/>
                    <Route  path="/btnDirector" component={BtnDirector}/>
                </Switch>
          
          
        )
    }
}

export default App;
