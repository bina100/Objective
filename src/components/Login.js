import React, {Component} from "react"
//import {Router} from "react-router-dom";
import axios from "axios";
import {Redirect} from "react-router-dom";
import BtnStudent from "./BtnStudent";
import './Login.css';
import { async } from "q";
export default class Login extends React.Component{

   constructor(props){
        super(props)
        // const token = localStorage.getItem("token")
        //this.loggedIn = null

       this.state = {
           loggedIn: false,
           username: '',
           password: '',
           isLoginOpen: true,
        //    isStudent: false,
        //    isGuide: false,
        //    isAdmin: false,
           redirectStudent: false,
           redirectGuide: false,
           redirectAdmin: false,
           username: "",
           password: "",
           errors: []
       }
       this.role="";
       this.onChange = this.onChange.bind(this)
       this.submitLogin = this.submitLogin.bind(this)

    }

        //Add New Error Object to the array {elm: msg}
    showValidationErr(elm, msg) {
        this.setState((prevState) => ({ errors: [...prevState.errors, {elm, msg}] }));
    }
    //Remove a specific element from the array 
    clearValidationErr(elm) {
        this.setState((prevState) => {
        let newArr = [];
        //Add all elements from the prev array to the new one that has a different element
        for (let err of prevState.errors) {
            if (elm != err.elm) {
            newArr.push(err);
            }
        }
        return {errors: newArr};
        });
    }

    //Update Username, password, and email on change event 
    onUsernameChange(e) {
        this.setState({username: e.target.value});
        //We want to clear the error when ever the user type something new 
        this.clearValidationErr("username");
    }

    onPasswordChange(e) {
        this.setState({password: e.target.value});
        this.clearValidationErr("password");
        //By default the state is weak
        this.setState({pwdState: "weak"});
        if (e.target.value.length > 12) {
        this.setState({pwdState: "strong"});
        } else if (e.target.value.length > 8) {
        this.setState({pwdState: "medium"});
        }
    }
    

    checkUser(e){
        this.role=e.target.id;
        console.log("role: ", this.role)
    }

    
   onChange(e){
       this.setState({
           [e.target.name]: e.target.value
       })
   }
   submitLogin(e){
       e.preventDefault()
           //Check for all input fields and show errors if empty (you can implement other cases!)
        if (this.state.username == "") {
            this.showValidationErr("username", "Username Cannot be empty!");
        }
        if (this.state.password == "") {
            this.showValidationErr("password", "Password Cannot be empty!");
        }
        (async ()=> {
            const response = await axios.post(
                '/userExist',
                { username: this.state.username, password: this.state.password, type: this.role },
                { headers: { 'Content-Type': 'application/json' } }
              )
              console.log("res" ,response.data)
              if(response.data === 'Success'){
                this.setState({loggedIn: true})
              }
              else if(response.data ==='Failed'){
                this.setState({loggedIn: false})
                alert("Please make sure to click the corect button, and that you typed in the corect username and password ")
              }
              else if(response.data === 'no_type')
                alert("please click on a button that matches user role")
             console.log("logged in: ", this.state.loggedIn)

        })();
    }

    render(){
        if(this.state.loggedIn && this.role==="Student"){
            return <Redirect to={{
                pathname: '/btnStudent',
                state: { id: this.state.password, username: this.state.username }
            }}/>
            
        }
        if(this.state.loggedIn && this.role === 'Admin'){
            return <Redirect to={{
                pathname: "/btnAdmin",
                state: {id: this.state.password, username: this.state.username}
            }}/>
        }
        if(this.state.loggedIn && this.role === 'Guide'){
            return <Redirect to={{
                pathname: "/btnGuide",
                state: {id: this.state.password, username: this.state.username}
            }}/>
        }
        //NULL by default (help us check when rendering)
        let usernameErr = null, passwordErr = null, emailErr = null;
        //Loop and find which ones has the error
        for (let err of this.state.errors) {
        //Assign the validation error message 
        if (err.elm == "username") {
        usernameErr = err.msg;
        }
        if (err.elm == "password") {
            passwordErr = err.msg;
        }
        }
        let pwdWeak = false,
        pwdMedium = false,
        pwdStrong = false;
        //Weak password set onlt the pwdWeak to true, cause render only the first bar 
        if (this.state.pwdState == "weak") {
        pwdWeak = true;
        } else if (this.state.pwdState == "medium") {
        //Medium pwd then render the weak and medium bars 
        pwdWeak = true;
        pwdMedium = true;
        } else if (this.state.pwdState == "strong") {
        //Strong, render all the previoud bars 
        pwdWeak = true;
        pwdMedium = true;
        pwdStrong = true;
        }

        return(  
            <div className="box-container">
            <div className="inner-container">
                <div className="header">
                <div className="btn-box">
                    <button type="button" id="Admin"  className="btn-user" onClick={this.checkUser.bind(this)}> Administer </button> ‏
                    <button type="button" id="Guide" className="btn-user" onClick={this.checkUser.bind(this)}> Guide </button> 
                    <button type="button" id="Student" className="btn-user" onClick={this.checkUser.bind(this)}> Studet </button> 
                </div>
                </div>
                <div className="box">

                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input
                    type="text"
                    name="username"
                    className="login-input"
                    placeholder="Username"
                    onChange={this.onUsernameChange.bind(this)}/>
                    <small className="danger-error">{usernameErr ? usernameErr  : ""}</small>

                </div>
                

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                    type="password"
                    name="password"
                    className="login-input"
                    placeholder="Password"
                    onChange={this.onPasswordChange.bind(this)}/>
                    <small className="danger-error">{passwordErr ? passwordErr  : ""}</small>
                    {this.state.password && <div className="password-state">
                    <div 
                        className={"pwd pwd-weak " + (pwdWeak ? "show"  : "")}></div>
                    <div
                        className={"pwd pwd-medium " + (pwdMedium ? "show" : "")}></div>
                    <div 
                        className={"pwd pwd-strong " + (pwdStrong ? "show" : "")}></div>
                    </div>}
                </div>        
                <button
                    type="button"
                    className="login-btn"
                    onClick={this.submitLogin.bind(this)}>Login
                </button>
                </div>
            </div>
            </div>
            

        );
    }
}

