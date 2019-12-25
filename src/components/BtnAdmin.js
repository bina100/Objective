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
        this.pushStudentQuestionnaireToDB = this.pushStudentQuestionnaireToDB.bind(this)
        this.pushGuideQuestionnaireToDB = this.pushGuideQuestionnaireToDB.bind(this)
    }

    clickAddQuestionnaire(){
        this.setState((currentState) => ({show_add_questionnaire: !currentState.show_add_questionnaire}))
    }

    fileChanged=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            var only_questions = {}
            for(var i=0;i<rows.length-1;i++)
                if(i%2 !==0)//skiping on comment rows
                    only_questions[Math.floor(i/2)] = rows[i][0].substring(2,rows[i][0].length)//adding property to object in format:{i:"question"}
            
            this.setState({questions: only_questions})
        })
        
    }

    loadGuideQuestionnaire=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            alert('hi')
            var arr = rows[0]
            var guide_questions = {}
            var ranges = {}
            for(var i=0;i<arr.length;i++){
                if(i==0 || i==1 || i==10 || i==11 || i==12)
                    guide_questions[i] = arr[i]
                else{
                    ranges[i] = arr[i].match(/\d+/)[0]// extracting numbers from question title
                    guide_questions[i] = arr[i]
                }
            }
            this.setState({guide_questions: guide_questions})
            this.setState({ranges: ranges})
            console.log('guide_questionsthis: ', this.state.guide_questions)
            console.log('\n')
            console.log('ranges: ', this.state.ranges)
        })
    }

    pushGuideQuestionnaireToDB(e){
        if(!this.state.chosen_course){
            alert('please select course')
            return
        }
        if(!this.state.guide_questions){
            alert('please upload file')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/push_guide_qustionnaire_to_db',
                { questions: this.state.guide_questions, ranges:this.state.ranges, CourseCode: this.state.chosen_course.course_code},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data.code === 'ER_DUP_ENTRY')//checking if course already has questionnaire
                alert('course already has a questionnaire')
              else if(response.data === 'Failed')
                alert("error saving questionnaire")
              else
                alert("questionnaire inserted")
        })();
    }

    pushStudentQuestionnaireToDB(e){
        if(!this.state.chosen_course){
            alert('please select course')
            return
        }
        if(!this.state.questions){
            alert('please upload file')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/push_student_qustionnaire_to_db',
                { questions: this.state.questions, CourseCode: this.state.chosen_course.course_code},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data.code === 'ER_DUP_ENTRY')//checking if course already has questionnaire
                alert('course already has a questionnaire')
              else if(response.data === 'Failed')
                alert("error saving questionnaire")
              else
                alert("questionnaire inserted")
        })();
    }

    loadStudentsOrGuides=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            var students = []
            for(var i=1;i<rows.length-1;i++){
                students.push(rows[i])
            }
            (async ()=> {
                console.log(e.target.id)
                const response = await axios.post(
                    '/load_students',
                    { students: students},
                    { headers: { 'Content-Type': 'application/json' } }
                  )
                  if(response.data.code === 'ER_DUP_ENTRY')//checking if course already has questionnaire
                    alert('duplicates in student file')
                  else if(response.data === 'Failed')
                    alert("error loading students")
                  else
                    alert("students loaded")
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
                console.log("courses: ", response.data)
                this.setState({fetched_courses: true})
                this.setState({courses: response.data})
            }
        })();
    }

    clickCourse(e){
        var course = JSON.parse(e.target.id)
        this.setState({chosen_course:{course_code:course.code, semester:course.semester, course_name:e.target.value}})
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
                return(<button key={index} id={JSON.stringify({code:course.Course_code, semester:course.Semester})} value={course.CourseName} onClick={this.clickCourse.bind()}>{course.CourseName}</button>)
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
                    <label>טעינת שאלון סטודנט למערכת:</label>
                    <input type="file" accept=".xlsx" onChange={this.fileChanged}/>
                    <button onClick={this.pushStudentQuestionnaireToDB.bind(this)}>טעינה</button>

                    <p/><label>טעינת שאלון מדריך למערכת:</label>
                    <input type="file" accept=".xlsx" id="guides" onChange={this.loadGuideQuestionnaire}/>
                    <button onClick={this.pushGuideQuestionnaireToDB.bind(this)}>טעינה</button>
                </div>}
                <p/><label>טעינת סטודנטים למערכת:</label>
                <input type="file" accept=".xlsx" id="students" onChange={this.loadStudents}/>

                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
