import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import axios from "axios";
import './BtnStudent.css'
import Questionnaire from './Questionnaire';
import Select from '@material-ui/core/Select';
import {Table} from 'reactstrap';
import { FormControl } from "@material-ui/core";
import Login from './Login';
import Form from 'react-bootstrap/Form'

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
            redirect:false
        }

        this.showCourses()
        this.fetchGuides()
        this.showQuestionnaire = this.showQuestionnaire.bind(this)
        this.deleteToken = this.deleteToken.bind(this)
        // this.selectedGuide = this.selectedGuide.bind(this)
        // this.selectedCourse = this.selectedCourse.bind(this)
        // this.handleAnswerChange = this.handleAnswerChange.bind(this)      
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

    get_user_details(){
        (async ()=> {
            const response = await axios.post(
                '/return_user_name',
                { username: this.user.username, password: this.user.password, type: 'students'},
                { headers: { 'Content-Type': 'application/json' } }
              )
              if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
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
              else if(response.data == 'OOT'){
                alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                this.setState({redirect:true})
              }
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
              else if(response.data == 'OOT'){
                  alert("האתר לא היה בשימוש הרבה זמן\n בבקשה התחבר שוב")
                  this.setState({redirect:true})
              }
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
        if(this.state.loggedIn === false || this.state.redirect){
            return <Redirect to="/"/>
        }

        if(this.state.fetched === false)
            return <h2>Loading...</h2>
        var coursesList = null
        if(this.state.courses_names && this.state.courses_codes){
            coursesList = this.state.courses_names.map((course, index) => {
            return(<option className="course-list-s" key={index+'course'} value={JSON.stringify({id:this.state.courses_codes[index], name:course})}>{course}</option>)
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
                <div className="head-of-page-s">
                    <h1>שלום {this.state.user_fname} {this.state.user_lname} </h1>
                </div>

                {show_courses_and_guides && <div>
                    <div className="space1"></div>
                    <div className="box-container-student">
                        <div className="inner-container-student">
                    <Table dir="rtl" className="table-select-course">
                        <tbody>
                        {      
                            <tr key={2}>
                                <td key={1}><div className="select-course"> <label >בחר קורס</label> </div></td> 
                                {/* <td key={2}><FormControl variant="outlined" className="course-list-s"> <Select className="course-list-s" native onChange={this.selectedCourse}>{coursesList}</Select></FormControl></td>  */}
                                <td key={2}>
                                    <Form.Group controlId="exampleForm.ControlSelect1" className="course-list-s" native onChange={this.selectedCourse}>
                                        <Form.Control as="select" className="course-list-s">{coursesList}</Form.Control>
                                    </Form.Group>
                                </td>
                            </tr>  
                             
                        }
                        </tbody>
                    </Table>
                    </div>
                    <div className="btn-show-questions">
                        <button className="show-q-btn" onClick={this.showQuestionnaire.bind(this)}>הצג שאלון</button>
                    </div>
                    <p/>
                    <p/>
                    </div>
                    <div className="space-log-out"></div>
                    </div>}
                    
                
                {this.state.questions}
                <div className="btn-sign-out-s">
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    <Link to='/' color="gray" onClick = {this.deleteToken.bind(this)}>התנתק</Link><p/>
                    {/* <Link to='/' color="gray">התנתק</Link><p/> */}
                </div>
            </div>
        )
    }
}
//export default BtnStudent;