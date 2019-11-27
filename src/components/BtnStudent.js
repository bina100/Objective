import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import axios from "axios";
import { async } from "q";
import './BtnStudent.css'
import Questionnaire from './Questionnaire';
import { style, display } from "@material-ui/system";

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
            fetched: false,
            questions:null,
            show_courses:true,
            show_questionnaire:true
        }
        // localStorage.setItem("token", null)
        // window.onbeforeunload=function(){
        //     localStorage.setItem("token", "student")
        // }
        this.showCourses()
        this.showQuestionnaire = this.showQuestionnaire.bind(this)
        // this.handleAnswerChange = this.handleAnswerChange.bind(this)        

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

    showCourses(){
        (async ()=> {
            const response = await axios.post(
                '/return_course_data_per_user',
                { password: this.user.password, type:'students'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert("student not signed to any course")
              else{
                var coursesArr = response.data.split(",")// storing couses names in array
                this.setState({courses: coursesArr})
            }
        })();
    }

    showQuestionnaire(e){//shows the questionnaire for chosen course on screen
        console.log("show", e.target.value, " questionnaire")
        this.setState({questions:<Questionnaire user_type={'students'} courseName={e.target.value}></Questionnaire>})
        this.setState((currentState) => ({show_courses: !currentState.show_courses}))
    }

    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }

        if(this.state.fetched === false)
            return <h2>Loading...</h2>
        var coursesList = null
        if(this.state.courses){
            coursesList = this.state.courses.map((course, index) => {
            return(this.state.show_courses && <div key={index}><button className="btn_of_course" value={course} onClick={this.showQuestionnaire.bind()}>{course}</button></div>)
            })
        }

        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום {this.state.user_fname} {this.state.user_lname} </h1>
                </div>
                <div className="list-of-courses">{coursesList}</div>{this.state.questions}
                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
//export default BtnStudent;
