import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";

export default class BtnGuide extends React.Component{
    constructor(props){
        super(props)

        const token = localStorage.getItem("token")
        let loggedIn = true
        if(token != "guide"){
            loggedIn = false
        }
        this.state = {  
            loggedIn: loggedIn
        }
        localStorage.setItem("token", null)
    }
    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }
        return(
            <div>
                <h1>This is Guide</h1>
                <Link to="/">sign out</Link>
            </div>
        )
    }
}
