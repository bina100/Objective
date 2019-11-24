import React, {Component} from "react"
import {Router} from "react-router-dom";
import axios from "axios";
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
            labNum:null
        }
        this.clickCourse = this.clickCourse.bind(this)
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
                alert("ferror loading courses")
              else{
                console.log("courses: ", response.data)
                this.setState({fetched_courses: true})
                this.setState({courses: response.data})
            }
        })();
    }

    clickCourse(){
        console.log("lab num: ", this.state.labNum)
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
                    console.log("course: ", course)
                return(<button value={course.CourseName} onClick={this.clickCourse.bind()}>{course.CourseName}</button>)
                })
            }
        }

        return(
            <div>
                <h1>Welcome {this.state.user_fname} {this.state.user_lname}</h1>
                <div>{coursesList}</div>
                <input type="number" step="1" min={7} max={10} value={this.state.labNum} onChange={this.setLabNum.bind(this)} />
                <Link to="/">sign out</Link>
            </div>
        )
    }
}
