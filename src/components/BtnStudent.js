import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import axios from "axios";

export default class BtnStudent extends React.Component{
    constructor(props){
        super(props)
        this.user = {}
        this.user.password = this.props.location.state.id
        this.user.username = this.props.location.state.username
        console.log("user id: ", this.user.password, "username: ", this.user.username)
        this.get_user_details()
        // const token = localStorage.getItem("token")
        let loggedIn = true
        // if(token != "student"){
        //     loggedIn = false
        // }
        this.state = {  
            loggedIn: loggedIn,
            fetched: false
        }
        // localStorage.setItem("token", null)
        // window.onbeforeunload=function(){
        //     localStorage.setItem("token", "student")
        // }
    }
    get_user_details(){
        (async ()=> {
            const response = await axios.post(
                '/return_user_name',
                { username: this.user.username, password: this.user.password, type: 'students'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              this.state.user_fname = response.data.FirstName
              this.state.user_lname = response.data.LastName
              this.setState({fetched: true})
        })();
    }



    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }

        if(this.state.fetched === false)
            return <h2>Loading...</h2>

        return(
            <div>
                <h1>Welcome {this.state.user_fname} {this.state.user_lname}</h1>
                <Link to="/">sign out</Link>
            </div>
        )
    }
}
//export default BtnStudent;
