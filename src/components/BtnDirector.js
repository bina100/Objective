import React, {Component} from "react"
import {Router} from "react-router-dom";
import axios from "axios";
import './BtnDirector.css'
import {Link, Redirect} from "react-router-dom";
import NumericInput from 'react-input-number';
import {Table} from 'reactstrap';
import {CSVLink, CSVDownload} from 'react-csv';



export default class BtnDirector extends React.Component{
    constructor(props){
        super(props)
        this.user = {}
        this.user.password = this.props.location.state.id
        this.user.username = this.props.location.state.username
        console.log("user id: ", this.user.password)
        this.get_user_details()
        this.get_courses_list()
        this.state = {  
            fetched_name: false,
            fetched_courses:false,
            labNum:1,
            full_table:'',
            exception_table:[],
            gap:'',
            show_full_table:false,
            show_exception_table:false
        }
        this.clickCourse = this.clickCourse.bind(this)
        this.show_all_questionnaires = this.show_all_questionnaires.bind(this)
        this.show_exceptional_events = this.show_exceptional_events.bind(this)
        this.set_table = this.set_table.bind(this)
    }

    get_user_details(){
        (async ()=> {
            const response = await axios.post(
                '/return_user_name',
                { username: this.user.username, password: this.user.password, type: 'director'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              this.state.user_fname = response.data.FirstName
              this.state.user_lname = response.data.LastName
              this.setState({fetched_name: true})
        })();
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
        var course_id = JSON.parse(e.target.id)
        this.setState({chosen_course:{course_code:course_id.code, semester:course_id.semester, course_name:e.target.value}})
    }

    update_gap(e){
        this.setState({gap:e.target.value})
    }

    set_table (data, table_type, err) {
        if(err)
            alert("err!!!!!")
        else{
            if(table_type == "show_all"){
                this.setState({full_table:data})
                // this.setState((currentState) => ({show_full_table: !currentState.show_full_table}))
                this.setState({show_full_table: true})

            }
            else{// exceptional events
                this.setState({show_exception_table: true})
                if(data.length >1){
                    this.setState({exception_table:data})
                    // this.setState((currentState) => ({show_exception_table: !currentState.show_exception_table}))
                }
            }

        }
    }

    show_all_questionnaires(e){
        this.fill_table(e, "show_all",'', this.set_table)        
    }

    show_exceptional_events(e){
        this.fill_table(e, "exceptional_events", this.state.gap, this.set_table)
    }


    fill_table(e, table_type, gap, callback){
        if(!this.state.chosen_course){
            alert('please click on course')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/return_course_follow_up',
                {course_code:this.state.chosen_course.course_code, semester:this.state.chosen_course.semester, course_name:this.state.chosen_course.course_name, lab_num: this.state.labNum},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert("error loading table")
              else{ // fetching answer ranges before building table
                (async ()=> {
                    const response_ranges = await axios.post(
                        '/fetch_answer_ranges_per_g_q',
                        {CourseCode:this.state.chosen_course.course_code},
                        { headers: { 'Content-Type': 'application/json' } }
                      )
                      if(response.data === 'Failed')
                        alert("error loading ranges")
                      else{
                        var ranges = (response_ranges.data).slice(2, response_ranges.data.length-2)
                        var data = [["שם סטודנט","ת.ז. סטודנט", "שם מדריך", "A1 ("+ranges[0].AnswerRange+")",
                                        "A2 ("+ranges[1].AnswerRange+")", 
                                        "A3 ("+ranges[2].AnswerRange+")", 
                                        "A4 ("+ranges[3].AnswerRange+")", 
                                        "A5 ("+ranges[4].AnswerRange+")", 
                                        "A6 ("+ranges[5].AnswerRange+")", 
                                        "A7 ("+ranges[6].AnswerRange+")", 
                                        "A8 ("+ranges[7].AnswerRange+")",
                                         "סכום ציונים", "ציון אינטואטיבי"]];
                        var exceptional_data = [["שם סטודנט","ת.ז. סטודנט", "שם מדריך", "A1 ("+ranges[0].AnswerRange+")",
                                        "A2 ("+ranges[1].AnswerRange+")", 
                                        "A3 ("+ranges[2].AnswerRange+")", 
                                        "A4 ("+ranges[3].AnswerRange+")", 
                                        "A5 ("+ranges[4].AnswerRange+")", 
                                        "A6 ("+ranges[5].AnswerRange+")", 
                                        "A7 ("+ranges[6].AnswerRange+")", 
                                        "A8 ("+ranges[7].AnswerRange+")",
                                        "סכום ציונים", "ציון אינטואטיבי"]];
                        var guide_table = response.data.guide_table
                        var student_table = response.data.student_table
                        for(var i=0;i<student_table.length;i+=2){
                            var row =[student_table[i].name, student_table[i].id, guide_table[i].name]
                            var exceptional_row = [student_table[i].name, student_table[i].id, guide_table[i].name]
                            var curr_student = student_table[i+1]
                            var curr_guide = guide_table[i+1]

                            var factor = 1
                            var sumStudentAnswers = 0
                            for(var j=1, k=0;j<curr_student.student.length;j++, k++){
                                if(j == 4)
                                    j++
                                if(k < ranges.length)
                                    factor = ranges[k].AnswerRange/10
                                sumStudentAnswers += parseInt((curr_student.student[j].AnswerNum)*factor)
                                row.push(curr_guide.guide[k].AnswerNum  +':' +Math.floor((curr_student.student[j].AnswerNum)*factor))
                                exceptional_row.push(curr_guide.guide[k].AnswerNum  +':' +Math.floor((curr_student.student[j].AnswerNum)*factor))
                            }
                            var sumAGuidenswers = curr_guide.guide[k+1].AnswerNum
                            row.push(sumAGuidenswers + ':' + sumStudentAnswers)
                            row.push(curr_guide.guide[k].AnswerNum)
                            exceptional_row.push(sumAGuidenswers + ':' + sumStudentAnswers)
                            exceptional_row.push(curr_guide.guide[k].AnswerNum)
                            data.push(row)
                            if(table_type == "exceptional_events"){
                                if(gap == ''){
                                    alert("הכנס ערך להגדרת הטווח")
                                    return
                                }
                                else if(Math.abs(sumStudentAnswers - sumAGuidenswers) >= gap)
                                    exceptional_data.push(exceptional_row)
                            }
                            console.log("exceptional_data: ", exceptional_data)
                            console.log("data: ", data)
                            if(table_type == "show_all")
                                callback (data)
                            else
                                callback(exceptional_data)
                        }
                    }
                })();
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
        if(this.state.fetched_name === false)
            return <h2>Loading...</h2>
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
        var full_table = null
        if(this.state.full_table!==''){
            full_table = (<div><Table dir="rtl" id = "table" >
            {/* // striped bordered hover> */}
            
                        <tbody>
                        {
                                this.state.full_table.map((row,i) =>{
                                    if(i == 0)
                                        return <tr key={i}>{row.map((num,j)=><th key={j}>{num}</th>)}</tr>
                                    else
                                       return <tr key={i}>{row.map((num,j)=><td key={j}>{num}</td>)}</tr>
                                })
                        }
                        </tbody>
            </Table><CSVLink data={this.state.full_table} >שמור כקובץ אקסל</CSVLink></div>)
        }
        var exception_table = null
        if(this.state.exception_table.length<1){
            exception_table =  <label>לא נמצאו ארועים חריגים בטווח {this.state.gap}</label>
        }
        else{
            exception_table = (<div><Table dir="rtl" id = "table" >
            
                        <tbody>
                        {
                                this.state.exception_table.map((row,i) =>{
                                    if(i == 0)
                                        return <tr key={i}>{row.map((num,j)=><th key={j}>{num}</th>)}</tr>
                                    else
                                    return <tr key={i}>{row.map((num,j)=><td key={j}>{num}</td>)}</tr>
                                })
                        }
                        </tbody>
            </Table><CSVLink className="bottom-left-corner" data={this.state.exception_table} >שמור כקובץ אקסל</CSVLink></div>)
        }

        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום  {this.state.user_fname} {this.state.user_lname}</h1>
                </div>
                <div>{coursesList}</div>
                <input type="number" step="1" min={1} max={10} value={this.state.labNum} onChange={this.setLabNum.bind(this)} />
                <p/><button onClick={this.show_all_questionnaires.bind(this)}>צפיה בכל השאלונים</button><p/>
                {this.state.show_full_table && <div className="follow-up-table">
                    <button onClick={(e)=> this.setState({show_full_table:false})}>x</button>{full_table}
                </div>}

                <label>הגדר טווח לאירוע חריג</label><input value = {this.state.gap} onChange={this.update_gap.bind(this)}></input>
                <button onClick={this.show_exceptional_events.bind(this)}>אירועים חריגים</button><p/>

                {this.state.show_exception_table &&<div className="follow-up-table">
                    <div><button onClick={(e)=> this.setState({show_exception_table:false})}>x</button>{exception_table}</div>
                </div>}
                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
