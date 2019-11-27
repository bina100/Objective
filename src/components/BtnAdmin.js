import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import axios from "axios";
import readXlsxFile from 'read-excel-file';

export default class BtnAdmin extends React.Component{
    constructor(props){
        super(props)
        this.user = {}
        this.user.password = this.props.location.state.id
        this.user.username = this.props.location.state.username
        console.log("user id: ", this.user.password)
        this.get_admin_details()
        this.get_courses_list()
        var loggedIn = true
        // const token = localStorage.getItem("token")
        // let loggedIn = true
        // if(token != "admin"){
        //     loggedIn = false
        // }
        this.state = {  
            loggedIn: loggedIn,
            fetched: false,
            fetched_courses:false,
            show_add_questionnaire:false
        }
        // localStorage.setItem("token", null)
        this.clickCourse = this.clickCourse.bind(this)
        this.clickAddQuestionnaire = this.clickAddQuestionnaire.bind(this)
    }

    clickAddQuestionnaire(){
        this.setState((currentState) => ({show_add_questionnaire: !currentState.show_add_questionnaire}))
    }

    fileChanged=(e)=>{
        console.log(e.target)
        readXlsxFile(e.target.files[0]).then(rows=>{
            var only_questions = {}
            for(var i=0;i<rows.length-1;i++)
                if(i%2 !==0)//skiping on comment rows
                    only_questions[Math.floor(i/2)] = rows[i][0].substring(2,rows[i][0].length)//adding property to object in format:{i:"question"}
            
            
            this.setState({questions: only_questions})
            console.log("state questions_arr",this.state.questions);
            (async ()=> {
                const response = await axios.post(
                    '/push_qustionnaire_to_db',
                    { questions: this.state.questions, CourseName: this.state.chosen_course.course_name},
                    { headers: { 'Content-Type': 'application/json' } }
                  )
                  if(response.data === 'Failed')
                    alert("error saving questionnaire")
                  else
                    alert("questionnaire inserted")
            })();

        })
        
    }

    get_courses_list(){
        (async ()=> {
            const response = await axios.post(
                '/return_all_courses',
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert("error loading courses")
              else{
                this.setState({fetched_courses: true})
                this.setState({courses: response.data})
            }
        })();
    }

    clickCourse(e){
        this.setState({chosen_course:{course_code:e.target.id, course_name:e.target.value}})
    }

    get_admin_details(){
        (async ()=> {
            const response = await axios.post(
                '/return_user_name',
                { username: this.user.username, password: this.user.password, type: 'admin'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              this.state.admin_fname = response.data.FirstName
              this.state.admin_lname = response.data.LastName
              this.setState({fetched: true})
        })();
    }


    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }
        if(this.state.fetched_courses === false)
            return <h4>Loading...</h4>
        else{
            var coursesList = null
            if(this.state.courses){
                coursesList = this.state.courses.map((course, index) => {
                return(<button key={index} id={course.Course_code} value={course.CourseName} onClick={this.clickCourse.bind()}>{course.CourseName}</button>)
                })
            }
        }

        if(this.state.fetched === false)
            return <h2>Loading...</h2>

        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום {this.state.admin_fname} {this.state.admin_lname} - מנהל</h1>
                    <p/>
                </div>
                <button onClick={this.clickAddQuestionnaire.bind(this)}>הוסף שאלון</button>
                {this.state.show_add_questionnaire && <div>
                    <div>{coursesList}</div>
    הוסף קובץ שאלון למאגר:
                    <input type="file" accept=".xlsx" onChange={this.fileChanged}/>
                </div>}
                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
