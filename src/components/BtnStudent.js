import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import axios from "axios";
import './BtnStudent.css'
import Questionnaire from './Questionnaire';
import Select from '@material-ui/core/Select';
import { FormControl } from "@material-ui/core";


export default class BtnStudent extends React.Component{
    constructor(props){
        super(props)
        this.user = {}
        this.user.password = this.props.location.state.id
        this.user.username = this.props.location.state.username
        console.log("user id: ", this.user.password, "username: ", this.user.username)
        this.get_user_details()

        let loggedIn = true

        this.state = {
            loggedIn: loggedIn,
            fetched: false,
            questions:null,
            show_questionnaire:true,
            fetched_guides:false,
        }

        this.showCourses()
        this.fetchGuides()
        this.showQuestionnaire = this.showQuestionnaire.bind(this)
        // this.selectedGuide = this.selectedGuide.bind(this)
        // this.selectedCourse = this.selectedCourse.bind(this)
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
                var coursesNamesArr = response.data.courses_names.split(",")// storing couses names in array
                var coursesCodesArr = JSON.parse(response.data.courses_id)
                this.setState({courses_names: coursesNamesArr})
                this.setState({courses_codes:coursesCodesArr})//array of objects
                this.setState({selectedCourse:{name:coursesNamesArr[0], code:coursesCodesArr[0].CourseCode, semester:coursesCodesArr[0].Semester}})
                console.log("courses: ", this.state.courses_names, " codes: ", this.state.courses_codes)
            }
        })();
    }

    fetchGuides(){
        (async ()=> {
            const response = await axios.post(
                '/return_all_guides',
                { password: this.user.password, type:'students'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert(response.data)
              else{
                this.setState({guides: response.data})// storing guides in array of objects
                this.setState((currentState) => ({fetched_guides: !currentState.fetched_guides}))
            }
        })();
    }

    selectedGuide=(e)=>{
        var guide = JSON.parse(e.target.value)
        this.setState({selectedGuide:guide.name})
    }

    selectedCourse=(e)=>{
        var course = JSON.parse(e.target.value)
        this.setState({selectedCourse:{name:course.name, code:course.id.CourseCode, semester:course.id.Semester}})
    }

    showQuestionnaire(e){//shows the questionnaire for chosen course on screen
        this.setState({questions:<Questionnaire user_type={'students'} courseName={this.state.selectedCourse.name} courseCode={this.state.selectedCourse.code} courseSemester={this.state.selectedCourse.semester}></Questionnaire>})
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
            return(<option key={index+'course'} value={JSON.stringify({id:this.state.courses_codes[index], name:course})}>{course}</option>)
            })
            // coursesList.unshift(<option key="0" value=""></option>)
        }

        if(this.state.guides){
            var guidesList = null
            guidesList = this.state.guides.map((guide, index)=>{
                return(<option key={index} value={JSON.stringify({id:guide.Password , name:guide.FirstName+' '+guide.LastName})}>{guide.FirstName+' '+guide.LastName}</option>)
            })
            guidesList.unshift(<option key="first" value=""></option>) // adding element to begining of array
        }
        var show_courses_and_guides = true
        if(this.state.questions != null)
            show_courses_and_guides = false

        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום {this.state.user_fname} {this.state.user_lname} </h1>
                </div><p/>
                {show_courses_and_guides && <div>
                    <FormControl variant="outlined">
                    <label>בחר מדריך מתאים</label>
                    <Select native onChange={this.selectedGuide.bind(this)}>{guidesList}</Select></FormControl>
                    
                    <FormControl variant="outlined">
                    <label>בחר קורס</label>
                    <Select native onChange={this.selectedCourse}>{coursesList}</Select></FormControl>
                    
                    <p/><button onClick={this.showQuestionnaire.bind(this)}>הצג שאלון</button>
                    </div>}
                
                {this.state.questions}
                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
//export default BtnStudent;
