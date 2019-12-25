import React, {Component} from "react"
import {Router} from "react-router-dom";
import axios from "axios";
import {Link, Redirect} from "react-router-dom";
import { async } from "q";
import Questionnaire from './Questionnaire';
import './BtnGuide.css';

export default class BtnGuide extends React.Component{
    constructor(props){
        super(props)
        this.user = {}
        this.user.password = this.props.location.state.id
        this.user.username = this.props.location.state.username
        console.log("user id: ", this.user.password)
        this.get_user_details()

        this.state = {  
            fetched: false,
            questions:null
        }
        this.showCourses()
        this.showQuestionnaire = this.showQuestionnaire.bind(this)
        this.showStudent = this.showStudent.bind(this)
    }

    get_user_details(){
        (async ()=> {
            const response = await axios.post(
                '/return_user_name',
                { username: this.user.username, password: this.user.password, type: 'guides'},
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
                { password: this.user.password, type:'guides'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert("guide not signed to any course")
              else{
                var coursesArr = response.data.courses_names.split(",")// storing couses names in array
                this.setState({courses_names: coursesArr})
                this.setState({courses_codes: JSON.parse(response.data.courses_id)})//array of objects {code:x, semester:y}
            }
        })();
    }

    showQuestionnaire(e){//shows the questionnaire for chosen course on screen
        console.log("show", e.target.value, " questionnaire")
        this.setState({questions:<Questionnaire user_type={'guides'} courseName={e.target.value}></Questionnaire>})
    }
    
    showStudent(e){
        if(true){
            var course = JSON.parse(e.target.id)
        }
        (async ()=> {
            const response = await axios.post(
                '/returns_students_per_guide_and_lab',
                { CourseCode: course.CourseCode, LabNum:1},//??????????????
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert("err returns_students_per_guide_and_lab")
              else{
                console.log(response.data)
            }
        })();
    }


    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }
        if(this.state.fetched === false)
            return <h2>Loading...</h2>

        var coursesList = null
        if(this.state.courses_names && this.state.courses_codes){
            coursesList = this.state.courses_names.map((course, index) => {
            return(<div key={index}><button id={JSON.stringify(this.state.courses_codes[index])} value={course} onClick={this.showStudent.bind(this)}>{course}</button></div>)
            })
        }

        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום {this.state.user_fname} {this.state.user_lname}</h1>
                </div>
                <div>{coursesList}</div>{this.state.questions}
                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}