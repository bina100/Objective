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
        const token = localStorage.getItem("token")
        let loggedIn = true
        if(token == "null"){
            loggedIn = false
        }

       this.state = {
           username: '',
           password: '',
           loggedIn: loggedIn,
           isLoginOpen: true,
           isStudent: false,
           isGuide: false,
           isAdmin: false,
           redirectStudent: false,
           redirectGuide: false,
           redirectAdmin: false,
           username: "",
           password: "",
           errors: []
       }
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
        if(e.target.id ==  "Student"){
        console.log("student")
        this.state.isStudent = true;
        this.state.isGuide = false;
        this.state.isAdmin = false;
        } 
        else if(e.target.id ==  "Guide"){
        console.log("Guide")
        this.state.isStudent = false;
        this.state.isGuide = true;
        this.state.isAdmin = false;
        }
        else{
        console.log("Admin")
        this.state.isStudent = false;
        this.state.isGuide = false;
        this.state.isAdmin = true;
        }
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
       const {username, password} = this.state
       //this.state.loggedIn = true;
        console.log("hello"+ this.state.loggedIn);
        if(this.state.isAdmin){
            //send POST request to check in Admin table
            localStorage.setItem("token","admin")
            this.setState((prevState, props) =>({
                loggedIn: !prevState.loggedIn
            }));
        }
        if(this.state.isGuide){
            localStorage.setItem("token","guide")
            this.setState((prevState, props) =>({
            loggedIn: !prevState.loggedIn
            }));
        }
        if(this.state.isStudent){
            (async ()=> {
                alert("try");
                const response = await axios.post(
                    '/studentExist',
                    { username: this.state.username, password: this.state.password, type: 'student' },
                    { headers: { 'Content-Type': 'application/json' } }
                  )
                  console.log(response.data)
            })();
            
            localStorage.setItem("token","student")
                this.setState((prevState, props) =>({
                loggedIn: !prevState.loggedIn
                }))
        }
    }
    render(){
        const isLoggedIn = this.state.loggedIn
        if(this.state.loggedIn && this.state.isStudent){
            return <Redirect to="/btnStudent"/>
        }
        if(this.state.loggedIn && this.state.isAdmin){
            return <Redirect to="/btnAdmin"/>
        }
        if(this.state.loggedIn && this.state.isGuide){
            return <Redirect to="/btnGuide"/>
        }
        console.log("hello2"+isLoggedIn);
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
        //{this.state.isLoginOpen && <LoginBox/>}
        }
        }

            /*       <div>
                        <h1>Login</h1>
                        <form onSubmit={this.submitFrom}>
                            <input type="text" placeholder="username" name="username" value={this.state.username} onChange={this.onChange}/>
                            <br/>
                            <input type="text" placeholder="password" name="password" value={this.state.password} onChange={this.onChange}/>
                            <br/>
                            { <input type="submit"/> }
                            <button onClick={this.submitFrom} >submit</button>
                    /*  </form>

                    </div>
                )
            }
        }*/
        //export default Login;
