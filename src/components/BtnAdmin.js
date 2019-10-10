import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import readXlsxFile from 'read-excel-file';

export default class BtnAdmin extends React.Component{
    constructor(props){
        super(props)

        const token = localStorage.getItem("token")
        let loggedIn = true
        if(token != "admin"){
            loggedIn = false
        }
        this.state = {  
            loggedIn: loggedIn
        }
        localStorage.setItem("token", null)
    }

    fileChanged=(e)=>{
        console.log(e.target)
        readXlsxFile(e.target.files[0]).then(rows=>{
            console.log("rows",rows);
        })
    }


    render(){
        if(this.state.loggedIn === false){
            return <Redirect to="/"/>
        }
        return(
            <div>
                <h1>This is Admin</h1>
                <Link to="/">sign out</Link>
                Add excel file of students names and tzs.
                <input type="file" accept=".xlsx" onChange={this.fileChanged}/>
            </div>
        )
    }
}
