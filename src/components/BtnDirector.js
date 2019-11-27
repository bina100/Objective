import React, {Component} from "react"
import {Router} from "react-router-dom";
import axios from "axios";
import './BtnDirector.css'
import {Link, Redirect} from "react-router-dom";
import NumericInput from 'react-input-number';

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
            full_table:''
        }
        this.clickCourse = this.clickCourse.bind(this)
        this.show_all_questionnaires = this.show_all_questionnaires.bind(this)
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
        this.setState({chosen_course:{course_code:e.target.id, course_name:e.target.value}})
    }

    show_all_questionnaires(e){
        if(!this.state.chosen_course){
            alert('please click on course')
            return
        }
        (async ()=> {
            const response = await axios.post(
                '/return_course_follow_up',
                {course_code:this.state.chosen_course.course_code, course_name:this.state.chosen_course.course_name, lab_num: this.state.labNum},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data === 'Failed')
                alert("error loading table")
              else{
                // console.log("table: ", response.data)
                var data = [["שם","ת.ז.", "A1","A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"]];
                var guide_table = response.data.guide_table
                var student_table = response.data.student_table
                for(var i=0;i<student_table.length;i+=2){
                    var row=[student_table[i].name, student_table[i].id]
                    var curr_student = student_table[i+1]
                    var curr_guide = guide_table[i/2].guide
                    console.log('curr g: ', curr_guide)
                    for(var j=0;j<curr_student.student.length;j++){
                        row.push(curr_student.student[j].AnswerNum +':' +curr_guide[j].AnswerNum)
                        // row.push(curr_guide[j].AnswerNum)
                    }
                    data.push(row)
                }
                this.setState({full_table:data})
                // console.log('full_table: ', this.state.full_table)
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
                return(<button key={index} id={course.Course_code} value={course.CourseName} onClick={this.clickCourse.bind()}>{course.CourseName}</button>)
                })
            }
        }
        if(this.state.full_table!==''){
            return(<table dir='rtl'>
                        <tbody>
                        {
                                this.state.full_table.map((row,i) =>(
                                <tr key={i}>{row.map((num,j)=><td key={j}>{num}</td>)}
                                </tr>
                                ))
                        }
                        </tbody>
            </table>)
        }

        return(
            <div dir="rtl">
                <div className="head-of-page">
                    <h1>שלום  {this.state.user_fname} {this.state.user_lname}</h1>
                </div>
                <div>{coursesList}</div>
                <input type="number" step="1" min={1} max={10} value={this.state.labNum} onChange={this.setLabNum.bind(this)} />
                <p/><button onClick={this.show_all_questionnaires.bind(this)}>צפיה בכל השאלונים</button><p/>
                {/* <div>{this.state.full_table}</div> */}
                <div className="btn-sign-out">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to="/" color="gray">התנתק</Link><p/>
                </div>
            </div>
        )
    }
}
