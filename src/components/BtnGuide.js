import React, {Component} from "react"
import {Router} from "react-router-dom";
import axios from "axios";
import {Link, Redirect} from "react-router-dom";
import { async } from "q";
import Questionnaire from './Questionnaire';
import './BtnGuide.css';
import {Table} from 'reactstrap';
import { FormControl } from "@material-ui/core";
import Select from '@material-ui/core/Select';


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
            questions:null,
            questionnaire_table:null,
            saveQestionnaire:false,
            labNum:1,
            time:true
        }
        this.answerRanges = []
        this.showCourses()
        this.buildQuestionnaireTable = this.buildQuestionnaireTable.bind(this)
        this.setChosenInput = this.setChosenInput.bind(this)
        this.submitQuestionnaire = this.submitQuestionnaire.bind()
    }

    setChosenInput(e){
        var index = e.target.id.split(",")
        var tmp_table = this.state.questionnaire_table
        var value = e.target.value

        if(e.target.value > this.answerRanges[index[1]])
            value = this.answerRanges[index[1]]
        else if(e.target.value < 1)
            value = 0

        tmp_table[index[0]][index[1]] = value
        this.setState({questionnaire_table:tmp_table})

        if(e.target.value > 10)
            this.setState({labNum:10})
        else if(e.target.value < 2)
            this.setState({labNum:1})
        else
            this.setState({labNum:e.target.value})
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
                var coursesCodesArr = JSON.parse(response.data.courses_id)
                this.setState({courses_names: coursesArr})
                this.setState({courses_codes: coursesCodesArr})//array of objects {code:x, semester:y}
            }
        })();
    }

    selectedCourse=(e)=>{
        var course = JSON.parse(e.target.value)
        this.setState({selectedCourse:{name:course.name, code:course.id.CourseCode, semester:course.id.Semester}})
    }
    
    buildQuestionnaireTable(e){
        if(true){
            var students = null
            var questions = null
            var questionnaire_table = []
            var course = JSON.parse(e.target.id)
            console.log("course: ", course)
        }
        // fetching all students per guide
        (async ()=> {
            const response = await axios.post(
                '/returns_students_per_guide_and_lab',
                { course: course},
                { headers: { 'Content-Type': 'application/json' } }
                )
                console.log("rs: ", response.data)
                if(response.data === 'Failed')
                    alert("err returns_students_per_guide_and_lab")
                else if(response.data === "check_data")
                    alert("מספר מעבדה לא תקין")
                else if(response.data === "not_time"){
                    this.setState({time:false})
                }
                else{
                    this.setState({showQuestionnaire:true})
                    console.log("students: ", response.data)
                    this.setState({time:true})
                    if(true){
                        console.log(response.data)
                        students = response.data[0]
                        this.setState({lab_name:response.data[1]})
                    }

                    // fetching guide questionnaire
                    (async ()=> {
                        const response = await axios.post(
                            '/return_guide_questionnaire',
                            { CourseCode: course.CourseCode},
                            { headers: { 'Content-Type': 'application/json' } }
                        )
                        if(response.data === 'Failed')
                            alert("err return_guide_questionnaire")
                        else{
                            questions = response.data
                            // building table
                            var titles = []
                            for(var i=0;i<response.data.length;i++){
                                if(i!==10){
                                    titles.push(response.data[i].Question)
                                    this.answerRanges.push(response.data[i].AnswerRange)
                                }   
                                else if(i===10)
                                    this.answerRanges.push(100)
                            }
                            questionnaire_table.push(titles)
                            for(var i=0;i<students.length;i++){
                                var row = []
                                row.push(students[i].Password)
                                row.push(students[i].LastName +" "+ students[i].FirstName)
                                row.push(0,0,0,0,0,0,0,0,0)
                                questionnaire_table.push(row)
                            }
                            this.setState({questionnaire_table:questionnaire_table})
                            this.setState({course:course})
                        }   
                    })();
                }
            })();
        }

    submitQuestionnaire=(e)=>{
        (async ()=> {
            console.log("table: ", this.state.questionnaire_table)
            const response = await axios.post(
                '/push_filled_g_qustionnaire_to_db',
                { table: this.state.questionnaire_table, course:this.state.course},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data.code === 'ER_DUP_ENTRY')
                alert("שאלון כבר מולא עי המדריך")
              if(response.data === 'Failed')
                alert("שגיאה בשמירת הנתונים")
              else{
                this.setState({showQuestionnaire:false})
                this.setState({saveQestionnaire:true})
                this.setState({LabNum:1})
               }
        })();
    }

    setLabNum(e){
        if(e.target.value > 10)
            this.setState({labNum:10})
        else if(e.target.value < 2)
            this.setState({labNum:1})
        else
            this.setState({labNum:e.target.value})
    }


    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }
        if(this.state.fetched === false)
            return <h2>Loading...</h2>
        var time_alert = null
        if(!this.state.time)
            time_alert = <div>אין שאלון למילוי המתאים לקורס הנבחר ולשעה הנוכחית</div>
        var lab_name = null
        if(this.state.lab_name)
            lab_name = this.state.lab_name

        var coursesList = null
        if(this.state.courses_names && this.state.courses_codes){
            coursesList = this.state.courses_names.map((course, index) => {
            // return(<option key={index+'course'} value={JSON.stringify({id:this.state.courses_codes[index], name:course})} >{course}</option>)
            return(<div key={index}><button id={JSON.stringify(this.state.courses_codes[index])} value={course} onClick={this.buildQuestionnaireTable.bind(this)}>{course}</button></div>)
            })
        }

        var full_table = null
        if(this.state.questionnaire_table!==null){
            full_table = (<div><Table dir="rtl" id = "table" >            
                        <tbody>
                        {
                                this.state.questionnaire_table.map((row,i) =>{
                                    if(i == 0)
                                        return <tr key={i}>{row.map((num,j)=><th key={j}>{num}</th>)}</tr>
                                    else{
                                        return <tr key={i}>{row.map((detail,j)=>{
                                            if(j==0 || j==1)
                                                return <td key={j}>{detail}</td>
                                            else
                                                return <td key={j}><input type="number" pattern="[0-9]*" inputMode="numeric" id={i+","+j} min={0} max={50} value={this.state.questionnaire_table[i][j]} onChange={this.setChosenInput.bind(this)} /></td>
                                            })}</tr>
                                        }
                                })
                        }
                        </tbody>
            </Table></div>)
        }


        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום {this.state.user_fname} {this.state.user_lname}</h1>
                </div>
                
                {!this.state.saveQestionnaire && <div>{coursesList}</div>}
                {time_alert}
                {this.state.questions}
                {lab_name}
                {this.state.showQuestionnaire && <div><div>{full_table}</div>
                <button type="button"
                className="save-btn"
                onClick={this.submitQuestionnaire.bind(this)}>שמור</button></div>}
                {(this.state.saveQestionnaire) && <h2>תודה ויום נעים!!!</h2>}

                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}