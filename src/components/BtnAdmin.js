import React, {Component} from "react"
import {Router} from "react-router-dom";
import './BtnAdnim.css'
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
            show_add_students:false,
            show_add_guides:false,
            show_add_s_questionnaire:false,
            show_add_g_questionnaire:false
        }
        // localStorage.setItem("token", null)
        this.clickCourse = this.clickCourse.bind(this)
        this.clickAddStudentQuestionnaire = this.clickAddStudentQuestionnaire.bind(this)
        this.clickAddGuideQuestionnaire = this.clickAddGuideQuestionnaire.bind(this)
        this.pushStudentsOrGuidesToDB = this.pushStudentsOrGuidesToDB.bind(this)
        this.pushStudentQuestionnaireToDB = this.pushStudentQuestionnaireToDB.bind(this)
        this.pushGuideQuestionnaireToDB = this.pushGuideQuestionnaireToDB.bind(this)
    }

    clickAddStudentQuestionnaire(){
        this.setState({show_add_s_questionnaire:true})
    }

    clickAddGuideQuestionnaire(){
        this.setState({show_add_g_questionnaire:true})
    }

    clickAddStudents(){
        this.setState({show_add_students:true})
    }

    clickAddGuides(){
        this.setState({show_add_guides:true})
    }

    loadStudentQuestionnaire=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            var only_questions = {}
            for(var i=0;i<rows.length-1;i++)
                if(i%2 !==0)//skiping on comment rows
                    only_questions[Math.floor(i/2)] = rows[i][0].substring(2,rows[i][0].length)//adding property to object in format:{i:"question"}
            
            this.setState({student_questions: only_questions})
        })
        
    }

    pushStudentQuestionnaireToDB(e){
        if(!this.state.chosen_course){
            alert('please select course')
            return
        }
        if(!this.state.student_questions){
            alert('please upload file')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/push_student_qustionnaire_to_db',
                { questions: this.state.student_questions, CourseCode: this.state.chosen_course.course_code},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data.code === 'ER_DUP_ENTRY')//checking if course already has questionnaire
                alert('course already has a questionnaire')
              else if(response.data === 'Failed')
                alert("error saving questionnaire")
              else{
                alert("questionnaire inserted")
                this.setState({show_add_s_questionnaire:false})
              }
        })();
    }

    loadGuideQuestionnaire=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            alert('hi')
            var arr = rows[0]
            var guide_questions = {}
            var ranges = {}
            for(var i=0;i<arr.length;i++){
                if(i==0 || i==1)
                    guide_questions[i] = arr[i]
                else{
                    if(i==10 || i==11)
                        ranges[i] = 100
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
              else{
                alert("questionnaire inserted")
                this.setState({show_add_g_questionnaire:false})
              }
        })();
    }

    loadStudentsOrGuides=(e)=>{
        var type = e.target.id
        readXlsxFile(e.target.files[0]).then(rows=>{
            var users = []
            for(var i=1;i<rows.length;i++){
                users.push(rows[i])
            }
            console.log("users: ", users, " type: ", type)
            if(type == "students")
                this.setState({students:users})
            else
                this.setState({guides:users})
        })
    }

    pushStudentsOrGuidesToDB(e){
        if(e.target.id == "students"){
            if(!this.state.students){
                alert("please upload file")
                return
            }
            (async ()=> {
                console.log(e.target.id)
                const response = await axios.post(
                    '/load_students',
                    { students: this.state.students},
                    { headers: { 'Content-Type': 'application/json' } }
                )
                if(response.data.code === 'ER_DUP_ENTRY')//making sure not loading doubles
                    alert('duplicates in student file')
                else if(response.data === 'Failed')
                    alert("error loading students")
                else{
                    alert("students loaded")
                    this.setState({show_add_students:false})
                }
            })();
        }
        else{
            if(!this.state.guides){
                alert("please upload file")
                return
            }
            (async ()=> {
                console.log("guides: ", this.state.guides)
                const response = await axios.post(
                    '/load_guides',
                    { guides: this.state.guides},
                    { headers: { 'Content-Type': 'application/json' } }
                )
                if(response.data.code === 'ER_DUP_ENTRY')//making sure not loading doubles
                    alert('duplicates in guide file')
                else if(response.data === 'Failed')
                    alert("error loading guides")
                else{
                    alert("guides loaded")
                    this.setState({show_add_guides:false})
                }
            })();
        }
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

                <p/><button onClick={this.clickAddStudents.bind(this)}>טעינת סטודנטים למערכת</button><p/>
                {this.state.show_add_students && <div className="chosen-window">
                    <div><button onClick={(e)=> this.setState({show_add_students:false})}>x</button></div>
                    <p/><label>בחר קובץ לטעינה</label>
                    <input type="file" accept=".xlsx" id="students" onChange={this.loadStudentsOrGuides}/>
                    <button id="students" onClick={this.pushStudentsOrGuidesToDB.bind(this)}>טעינה</button>
                </div>}

                <p/><button onClick={this.clickAddGuides.bind(this)}>טעינת מדריכים למערכת</button><p/>
                {this.state.show_add_guides && <div className="chosen-window">
                    <div><button onClick={(e)=> this.setState({show_add_guides:false})}>x</button></div>
                    <p/><label>בחר קובץ לטעינה</label>
                    <input type="file" accept=".xlsx" id="guides" onChange={this.loadStudentsOrGuides}/>
                    <button id="guides" onClick={this.pushStudentsOrGuidesToDB.bind(this)}>טעינה</button>
                </div>}

                <button onClick={this.clickAddStudentQuestionnaire.bind(this)}>הוספת שאלון סטודנט</button><p/>
                {this.state.show_add_s_questionnaire && <div className="chosen-window">
                    <div><button onClick={(e)=> this.setState({show_add_s_questionnaire:false})}>x</button></div>
                    <div>{coursesList}</div>
                    <input type="file" accept=".xlsx" onChange={this.loadStudentQuestionnaire}/>
                    <button onClick={this.pushStudentQuestionnaireToDB.bind(this)}>טעינה</button>
                </div>}

                <p/><button onClick={this.clickAddGuideQuestionnaire.bind(this)}>הוספת שאלון מדריך</button><p/>
                {this.state.show_add_g_questionnaire && <div className="chosen-window">
                    <div><button onClick={(e)=> this.setState({show_add_g_questionnaire:false})}>x</button></div>
                    <div>{coursesList}</div>
                    <input type="file" accept=".xlsx" id="guides" onChange={this.loadGuideQuestionnaire}/>
                    <button onClick={this.pushGuideQuestionnaireToDB.bind(this)}>טעינה</button>
                </div>}

                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
