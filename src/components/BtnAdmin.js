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
        var loggedIn = true
        // const token = localStorage.getItem("token")
        // let loggedIn = true
        // if(token != "admin"){
        //     loggedIn = false
        // }
        this.state = {  
            loggedIn: loggedIn,
            fetched: false
        }
        // localStorage.setItem("token", null)
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
                    { questions: this.state.questions, CourseName: 'biology'},
                    { headers: { 'Content-Type': 'application/json' } }
                  )
                  if(response.data === 'Failed')
                    alert("error saving questionnaire")
                  else
                    alert("questionnaire inserted")
            })();

        })
        
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

        if(this.state.fetched === false)
            return <h2>Loading...</h2>

        return(
            <div>
                <h1>Welcome {this.state.admin_fname} {this.state.admin_lname} - Adnministrator</h1>
                <Link to="/">sign out</Link>
                <p/>
                Add excel file of students names and tzs.
                <input type="file" accept=".xlsx" onChange={this.fileChanged}/>
            </div>
        )
    }
}
