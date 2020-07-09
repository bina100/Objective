import React, {Component} from "react"
import {Router} from "react-router-dom";
import './BtnAdnim.css';
import styles from './Navbar.css';
import {NavLink, Link, Redirect} from "react-router-dom";
import axios from "axios";
import readXlsxFile from 'read-excel-file';
import {Navbar, Nav, NavItem, Tab} from 'react-bootstrap'

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

        this.state = {  
            loggedIn: loggedIn,
            fetched: false,
            fetched_courses:false,
            id:"000000000",
            show_add_students:true,
            show_add_guides:false,
            show_add_directores:false,
            show_add_admin:false,
            show_add_s_questionnaire:false,
            show_add_g_questionnaire:false,
            show_add_labs:false,
            show_add_scheduling:false,
            succeed_delete_s:false,
            succeed_delete_g:false,
            succeed_delete_d:false,
            succeed_delete_q:false,
            redirect:false,
        }
        this.clickCourse = this.clickCourse.bind(this)
        this.clickAddQuestionnaire = this.clickAddQuestionnaire.bind(this)
        this.clickAddLabs = this.clickAddLabs.bind(this)
        this.clickAddScheduling = this.clickAddScheduling.bind(this)
        this.pushStudentsOrGuidesOrDirectoresOrAdminToDB = this.pushStudentsOrGuidesOrDirectoresOrAdminToDB.bind(this)
        this.pushStudentQuestionnaireToDB = this.pushStudentQuestionnaireToDB.bind(this)
        this.pushGuideQuestionnaireToDB = this.pushGuideQuestionnaireToDB.bind(this)
        this.pushLabsToDB = this.pushLabsToDB.bind(this)
        this.pushSchedulingsToDB = this.pushSchedulingsToDB.bind(this)
        this.deleteUser = this.deleteUser.bind(this)
        this.deleteQuestionnaire = this.deleteQuestionnaire.bind(this)
        this.deleteToken = this.deleteToken.bind(this)
    }
    clickAddQuestionnaire(){
        this.setState({show_add_questionnaire:true})
        this.setState({show_add_students:false})
        this.setState({show_add_directores:false})
        this.setState({show_add_admin:false})   
        this.setState({show_add_guides:false})
        this.setState({show_add_labs:false})
        this.setState({show_add_scheduling:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }

    deleteToken(){
        (async ()=> {
            const response = await axios.post(
                '/delete_token',
                { username: this.user.username},
                { headers: { 'Content-Type': 'application/json' } }
              )
        })();   
    }

    clickAddStudents(){
        this.setState({show_add_students:true})
        this.setState({show_add_guides:false})
        this.setState({show_add_directores:false})
        this.setState({show_add_admin:false})
        this.setState({show_add_questionnaire:false})
        this.setState({show_add_labs:false})
        this.setState({show_add_scheduling:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }

    clickAddGuides(){
        this.setState({show_add_guides:true})
        this.setState({show_add_students:false})
        this.setState({show_add_directores:false})
        this.setState({show_add_admin:false})
        this.setState({show_add_questionnaire:false})
        this.setState({show_add_labs:false})
        this.setState({show_add_scheduling:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }
    clickAddDirectores(){
        this.setState({show_add_directores:true})
        this.setState({show_add_guides:false})
        this.setState({show_add_students:false})
        this.setState({show_add_admin:false})
        this.setState({show_add_questionnaire:false})
        this.setState({show_add_labs:false})
        this.setState({show_add_scheduling:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }
    clickAddAdmin(){
        this.setState({show_add_admin:true})
        this.setState({show_add_guides:false})
        this.setState({show_add_students:false})
        this.setState({show_add_directores:false})
        this.setState({show_add_questionnaire:false})
        this.setState({show_add_labs:false})
        this.setState({show_add_scheduling:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }
    clickAddLabs(){
        this.setState({show_add_labs:true})
        this.setState({show_add_guides:false})
        this.setState({show_add_students:false})
        this.setState({show_add_directores:false})
        this.setState({show_add_admin:false})
        this.setState({show_add_questionnaire:false})
        this.setState({show_add_scheduling:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }

    clickAddScheduling(){
        this.setState({show_add_scheduling:true})
        this.setState({show_add_guides:false})
        this.setState({show_add_students:false})
        this.setState({show_add_directores:false})
        this.setState({show_add_admin:false})
        this.setState({show_add_questionnaire:false})
        this.setState({show_add_labs:false})
        this.setState({show_delete_student:false})
        this.setState({show_delete_guide:false})
        this.setState({show_delete_director:false})
    }
    
    //--------- student questionnaire--------------------------------------
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
              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
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
    //--------- guide questionnaire--------------------------------------
    loadGuideQuestionnaire=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            console.log("rows: ", rows)
            if(!rows){
                alert("קובץ לא תקין")
                return
            }
            var arr = rows[0]
            var guide_questions = {}
            var ranges = {}
            for(var i=0;i<arr.length;i++){
                if(i==0 || i==1)
                    guide_questions[i] = arr[i]
                else{
                    if(i==10 || i==11)
                        ranges[i.toString()] = 100
                    // ranges[i.toString()] = arr[i].match(/(\d+)/)[0]// extracting numbers from question title
                    ranges[i.toString()] = arr[i].replace(/^\D+/g,'')// extracting numbers from question title
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
              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
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

     //--------- labs --------------------------------------
     loadLabs=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            this.setState({labs: rows.slice(1, rows.length)})
        })
    }

    pushLabsToDB(e){
        if(!this.state.labs){
            alert('please upload file')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/load_labs',
                { labs: this.state.labs},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
              if(response.data.code === 'ER_DUP_ENTRY')//checking if there are doubles
                alert('duplicates in lab file')
              else if(response.data === 'Success'){
                alert("labs file inserted")
              }
              else
                alert("error loading labs")
        })();
    }

    //--------- scheduling --------------------------------------
    loadScheduling=(e)=>{
        readXlsxFile(e.target.files[0]).then(rows=>{
            this.setState({schedulings: rows.slice(1, rows.length)})
        })
    }

    pushSchedulingsToDB(e){
        if(!this.state.schedulings){
            alert('please upload file')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/load_schedulings',
                { schedulings: this.state.schedulings},
                { headers: { 'Content-Type': 'application/json' } }
            )
            if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
            }
            else if(response.data.code === 'ER_DUP_ENTRY')//checking if there are doubles
                alert('duplicates in schedulings file')
            else if(response.data === 'Success'){
                alert("schedulings file inserted")
            }
            else
                alert("error loading schedulings")
        })();
    }
    //--------- students guides and directores--------------------------------------
    loadStudentsOrGuidesOrDirectorOrAdmin=(e)=>{
        var type = e.target.id
        readXlsxFile(e.target.files[0]).then(rows=>{
            var users = []
            for(var i=1;i<rows.length;i++){
                users.push(rows[i])
            }
            console.log("users: ", users, " type: ", type)
            if(type == "students")
                this.setState({students:users})
            else if(type=="guides")
                this.setState({guides:users})
            else if(type=="directores")
                this.setState({directores:users})
            else
                this.setState({admin:users})

        })
    }

    pushStudentsOrGuidesOrDirectoresOrAdminToDB(e){
        if(e.target.id == "students"){
            if(!this.state.students){
                alert("לא נטען קובץ")
                return
            }
            (async ()=> {
                console.log(e.target.id)
                const response = await axios.post(
                    '/load_students',
                    { students: this.state.students},
                    { headers: { 'Content-Type': 'application/json' } }
                )
                if(response.data == 'OOT'){
                    alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                    this.setState({redirect:true})
                }
                else if(response.data.code === 'ER_DUP_ENTRY')//making sure not loading doubles
                    alert('חלק מהנתונים כבר קיימים')
                else if(response.data === 'Failed')
                    alert("שגיעה בטעינת קובץ סטודנטים")
                else{
                    alert("קובץ סטודנטים נטען בהצלחה")
                    this.setState({show_add_students:false})
                }
            })();
        }
        else if(e.target.id == "guides"){
            if(!this.state.guides){
                alert("לא נטען קובץ")
                return
            }
            (async ()=> {
                console.log("guides: ", this.state.guides)
                const response = await axios.post(
                    '/load_guides',
                    { guides: this.state.guides},
                    { headers: { 'Content-Type': 'application/json' } }
                )
                if(response.data == 'OOT'){
                    alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                    this.setState({redirect:true})
                }
                else if(response.data.code === 'ER_DUP_ENTRY')//making sure not loading doubles
                    alert('חלק מהנתונים כבר קיימים')
                else if(response.data === 'Failed')
                    alert("שגיעה בטעינת קובץ מדריכים")
                else{
                    alert("קובץ מדריכים נטען בהצלחה")
                }
            })();
        }
        else if(e.target.id == "directores"){
            if(!this.state.directores){
                alert("לא נטען קובץ")
                return
            }
            (async ()=> {
                console.log(e.target.id)
                const response = await axios.post(
                    '/load_directores',
                    { directores: this.state.directores},
                    { headers: { 'Content-Type': 'application/json' } }
                )
                if(response.data == 'OOT'){
                    alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                    this.setState({redirect:true})
                }
                else if(response.data.code === 'ER_DUP_ENTRY')//making sure not loading doubles
                    alert('חלק מהנתונים כבר קיימים')
                else if(response.data === 'Failed')
                    alert("שגיעה בטעינת קובץ מנהל מעבדה")
                else{
                    alert("קובץ מנהל מעבדה נטען")
                }
            })();
        }
        else{
            if(!this.state.admin){
                alert("לא נטען קובץ")
                return
            }
            (async ()=> {
                console.log("tar ",e.target.id)
                const response = await axios.post(
                    '/load_admin',
                    { admin: this.state.admin, password: this.user.password, id:e.target.id},
                    { headers: { 'Content-Type': 'application/json' } }
                )
                if(response.data == 'OOT'){
                    alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                    this.setState({redirect:true})
                }
                else if(response.data.code === 'ER_DUP_ENTRY')//making sure not loading doubles
                    alert('משתמש קיים')
                else if(response.data === 'Failed')
                    alert("שגיעה בטעינת קובץ")
                else{
                    alert("admin loaded")
                }
            })();
        }
    }

    //-------------delete user------------------------------------------------------
    deleteUser(e){
        (async ()=> {
            const response = await axios.post(
                '/delete_user',
                {id: this.state.id, user_type:e.target.id},
                { headers: { 'Content-Type': 'application/json' } }
              )

              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
              else if(response.data === 'Failed')
                alert("שגיעה במחיקת משתמש")
              else if(response.data === 'Failed not exist')
                alert("משתמש לא קיים")
              else{
                console.log("נמחק בהצלחה ", this.state.id, " :משתמש")
                
                console.log("abc ", response.data)
                if(response.data == "student"){
                    this.setState({show_delete_director:false})
                    this.setState({show_delete_guide:false})
                    this.setState({show_delete_student:true})
                    this.setState({succeed_delete_s:true})
                }
                   
                else if (response.data == "guide"){
                    this.setState({show_delete_director:false})
                    this.setState({show_delete_guide:true})
                    this.setState({show_delete_student:false})
                    this.setState({succeed_delete_g:true})

                }
                else
                    this.setState({show_delete_director:true})
                    this.setState({show_delete_guide:false})
                    this.setState({show_delete_student:false})
                    this.setState({succeed_delete_d:true})
            
            }
        })();
    }

    
    //-------------delete questionnaire------------------------------------------------------
    deleteQuestionnaire(e){
        if(!this.state.chosen_course){
            alert('please select course')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/delete_questionnaire',
                {CourseCode: this.state.chosen_course.course_code, type:e.target.id},
                { headers: { 'Content-Type': 'application/json' } }
              )

              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
              else if(response.data === 'Failed')
                alert("שגיאה במחיקת שאלון")
              else{
                this.setState({succeed_delete_q:true})
                alert("השאלון נמחק בהצלחה")
              }
        })();
    }

    //-------------delete schedule------------------------------------------------------
    deleteSchedule(e){
        if(!this.state.chosen_course){
            alert('please select course')
            return
        }
        else if(!this.state.StudentCode){
            alert('please enter student id')
            return
        }
        else if(!this.state.GuideCode){
            alert('please enter guide id')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/delete_schedule',
                {CourseCode: this.state.chosen_course.course_code, studentCode:this.state.studentCode, guideCode:this.state.guideCode, datetime:this.state.datetime},
                { headers: { 'Content-Type': 'application/json' } }
                )

                if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
                }
                else if(response.data === 'Failed')
                alert("שגיאה במחיקת שיבוץ, אנא בדוק שהפרטים שהזנת נכונים")
                else{
                this.setState({succeed_delete_q:true})
                alert("השיבוץ נמחק בהצלחה")
                }
        })();
    }
    
    //-------------delete lab------------------------------------------------------
    deleteLab(e){
        if(!this.state.chosen_course){
            alert('please select course')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/delete_lab',
                {CourseCode: this.state.chosen_course.course_code, datetime:this.state.datetime},
                { headers: { 'Content-Type': 'application/json' } }
                )

                if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
                }
                else if(response.data === 'Failed')
                alert("שגיאה במחיקת שיבוץ, אנא בדוק שהפרטים שהזנת נכונים")
                else{
                this.setState({succeed_delete_q:true})
                alert("מפגש המעבדה נמחק בהצלחה")
                }
        })();
    }
    get_courses_list(){
        (async ()=> {
            const response = await axios.post(
                '/return_all_courses',
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
              else if(response.data === 'Failed')
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
              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
              this.state.admin_fname = response.data.FirstName
              this.state.admin_lname = response.data.LastName
              this.setState({fetched: true})
        })();
    }


    render(){
        if(this.state.loggedIn === false || this.state.redirect){
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
        const navbarItems = [{
            label: "Item 1",
            target: "lodeS"
        }, {
            label: "Item 2",
            target: "item-2"
        }, {
            label: "Item 3",
            target: "item-3"
        }, ]
        return(
            <div dir="rtl">
                <div className="head-of-page-a">
                    <h1>שלום {this.state.admin_fname} {this.state.admin_lname} - מנהל</h1>
                    <p/>
                </div>
                <div>
                    <Navbar  variant="light">
                    <Navbar.Collapse id="basic-navbar-nav">
                    <Nav>
                    <Link className="nav-link"  id="btn" onClick={this.clickAddStudents.bind(this)}> סטודנטים </Link>
                    
                    <Link className="nav-link" id="btn" onClick={this.clickAddGuides.bind(this)}> מדריכים </Link>
                    
                    <Link className="nav-link" id="btn" onClick={this.clickAddDirectores.bind(this)}> מנהל מעבדה </Link>

                    <Link className="nav-link" id="btn" onClick={this.clickAddAdmin.bind(this)}> מנהל </Link>

                    <Link className="nav-link" id="btn" onClick={this.clickAddQuestionnaire.bind(this)}> שאלונים </Link>

                    <Link className="nav-link" id="btn" onClick={this.clickAddLabs.bind(this)}> מעבדות</Link>

                    <Link className="nav-link" id="btn" onClick={this.clickAddScheduling.bind(this)}> שיבוצים</Link>
                    </Nav>
                    </Navbar.Collapse>
                    </Navbar> 
                </div>  
                {this.state.show_add_students && <div>
                        <div className="chosen-window">
                        <p/><label>בחר קובץ לטעינת סטודנטים </label><p/>
                        <input type="file" accept=".xlsx" id="students" onChange={this.loadStudentsOrGuidesOrDirectorOrAdmin}/>
                        <button id="students" onClick={this.pushStudentsOrGuidesOrDirectoresOrAdminToDB.bind(this)}>טעינה</button>
                        </div>
                        <div className="chosen-window">
                        <p/><label> מחיקת סטודנט </label><p/>
                        <input type="text" placeholder="תעודת זהות סטודנט" onChange={e=>{this.setState({id:e.target.value})}}></input>
                        {/* <input type="file" accept=".xlsx" id="students" onChange={this.loadStudentsOrGuidesOrDirectorOrAdmin}/> */}
                        <button id="students"  onClick={this.deleteUser.bind(this)}>מחיקה</button>
                        {this.state.succeed_delete_s &&<div><h3>הסטודנט נמחק</h3></div>}
                        </div>
                    </div>}
                {this.state.show_add_guides && <div>
                        <div className="chosen-window">
                        <p/><label>בחר קובץ לטעינת מדריך</label><p/>
                        <input type="file" accept=".xlsx" id="guides" onChange={this.loadStudentsOrGuidesOrDirectorOrAdmin}/>
                        <button id="guides" onClick={this.pushStudentsOrGuidesOrDirectoresOrAdminToDB.bind(this)}>טעינה</button>
                        </div>
                        <div className="chosen-window">
                        <p/><label> מחיקת מדריך </label><p/>
                        <input type="text" placeholder="תעודת זהות מדריך" onChange={e=>{this.setState({id:e.target.value})}}></input>
                        <button id="guides"  onClick={this.deleteUser.bind(this)}>מחיקה</button>
                        {this.state.succeed_delete_g &&<div><h3>המדריך נמחק</h3></div>}
                        </div>
                    </div>}  
                {this.state.show_add_directores && <div>
                    <div className="chosen-window"> 
                        <p/><label>בחר קובץ לטעינת מנהל מעבדה </label><p/>
                        <input type="file" accept=".xlsx" id="directores" onChange={this.loadStudentsOrGuidesOrDirectorOrAdmin}/>
                        <button id="directores" onClick={this.pushStudentsOrGuidesOrDirectoresOrAdminToDB.bind(this)}>טעינה</button>
                    </div>
                    <div className="chosen-window">
                        <p/><label> מחיקת מנהל מעבדה </label><p/>
                        <input type="text" placeholder="תעודת זהות מנהל מעבדה" onChange={e=>{this.setState({id:e.target.value})}}></input>
                        <button id="directores"  onClick={this.deleteUser.bind(this)}>מחיקה</button>
                        {this.state.succeed_delete_d &&<div><h3>המנהל מעבדה נמחק</h3></div>}
                    </div>
                </div>}
                {this.state.show_add_admin && <div className="chosen-window">
                    <p/><label>בחר קובץ לעדכון פרטי מנהל  </label><p/>
                    <input type="file" accept=".xlsx" id="admin" onChange={this.loadStudentsOrGuidesOrDirectorOrAdmin}/>
                    <button id="admin" onClick={this.pushStudentsOrGuidesOrDirectoresOrAdminToDB.bind(this)}>טעינה</button>
                </div>}
                {this.state.show_add_questionnaire && <div className="questionnaire">
                        <div className="chosen-window"><label>הוסף שאלון סטודנט</label><p/>
                        <div>{coursesList}</div>
                        <input type="file" accept=".xlsx" onChange={this.loadStudentQuestionnaire}/>
                        <button onClick={this.pushStudentQuestionnaireToDB.bind(this)}>טעינה</button>
                        </div>
                        <div className="chosen-window">
                        <label>הוספת שאלון מדריך</label><p/>
                        <div>{coursesList}</div>
                        <input type="file" accept=".xlsx" id="guides" onChange={this.loadGuideQuestionnaire}/>
                        <button onClick={this.pushGuideQuestionnaireToDB.bind(this)}>טעינה</button>
                        </div>
                        <div className="chosen-window"><label>מחיקת שאלון מדריך</label><p/>
                        <div>{coursesList}</div>
                        <button id="guide_questions"  onClick={this.deleteQuestionnaire.bind(this)}>מחיקה</button>
                        </div>
                        <div className="chosen-window"><label>מחיקת שאלון סטודנט</label><p/>
                        <div>{coursesList}</div>
                        <button id="student_questions"  onClick={this.deleteQuestionnaire.bind(this)}>מחיקה</button>
                        </div>
                    </div>}
                {this.state.show_add_labs && <div>
                    <div className="chosen-window">
                    <label>הוסף מעבדה</label><p/>
                    <input type="file" accept=".xlsx" onChange={this.loadLabs}/>
                    <button onClick={this.pushLabsToDB.bind(this)}>טעינה</button>
                    </div>
                    <div className="chosen-window"><label>מחיקת מפגש מעבדה</label><p/>
                        <div>{coursesList}</div>
                        <input type="datetime-local" onChange={e=>{this.setState({datetime:e.target.value})}}></input>
                        <button onClick={this.deleteLab.bind(this)}>מחיקה</button>
                    </div>
                </div>}
                {this.state.show_add_scheduling && <div>
                    <div className="chosen-window">                    
                    <label>הוסף שיבוץ</label><p/>
                    <input type="file" accept=".xlsx" onChange={this.loadScheduling}/>
                    <button onClick={this.pushSchedulingsToDB.bind(this)}>טעינה</button>
                    </div>
                    <div className="chosen-window"><label>מחיקת שיבוץ</label><p/>
                        <div>{coursesList}</div>
                        <input type="text" placeholder="תעודת זהות סטודנט" onChange={e=>{this.setState({studentCode:e.target.value})}}></input>
                        <input type="text" placeholder="תעודת זהות מדריך" onChange={e=>{this.setState({guideCode:e.target.value})}}></input>
                        <input type="datetime-local" onChange={e=>{this.setState({datetime:e.target.value})}}></input>
                        <button onClick={this.deleteSchedule.bind(this)}>מחיקה</button>
                    </div>
                </div>}
                <div className="btn-sign-out-a">
                    <i className="fa fa-sign-out" aria-hidden="true" ></i>
                    <Link to='/' color="gray" onClick = {this.deleteToken.bind(this)}>התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
        
