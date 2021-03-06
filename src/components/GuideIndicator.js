import React, {Component} from "react"
import {Router} from "react-router-dom";
import {Link, Redirect} from "react-router-dom";
import axios from "axios";
import { async } from "q";
import { withStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import Radio from '@material-ui/core/Radio';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import './Questionnaire.css'

export default class Questionnaire extends React.Component{
    constructor(props){
        super(props)

        this.state={
            selectedValue1: null,
            selectedValue2: null,
            selectedValue3: null,
            selectedValue4: null,
            selectedValue5: null,
            selectedValue6: null,
            selectedValue7: null,
            selectedValue8: null,
            selectedValue9: null,
            selectedValue10: null,
            show_qestionnaire:true,
            comments:''
        }
        
        // const [selectedValue, setSelectedValue] = React.useState('a');

        this.showQuestionnaire(this.props.courseName)
        this.handleChange = this.handleChange.bind(this)
        this.onCommentChange = this.onCommentChange.bind(this)
    }

    showQuestionnaire(courseName){//fetches the questionnaire for chosen course
        (async ()=> {
            const response = await axios.post(
                'return_course_qustionnaire',
                {CourseName: courseName},
                { headers: { 'Content-Type': 'application/json' } }
            )
            if(response.data === 'Failed')
                alert("err fetching questionnaire")
            else
                this.setState({questions: response.data})
        })();
    }

    //Update comments
    onCommentChange(e) {
        this.state.comments=e.target.value
    }

    handleChange = event => {
        console.log('id: ', event.target.id, ' value: ', event.target.value)
        this.setState({['selectedValue'+event.target.id]:event.target.value});
      };

    submitQuestionnaire(e){
        var answers = {}
        for( var i=1; i<=Object.keys(this.state.questions).length; i++){
            if(!this.state['selectedValue'+i]){
                alert("please make sure to answer all questions")
                break
            }
            answers[i] = this.state['selectedValue'+i]
        }
        if(i<=Object.keys(this.state.questions).length)
            return
        (async ()=> {
            const response = await axios.post(
                  //!!!!!!----lab num----!!!!!!!!!
                'push_filled_s_qustionnaire_to_db',
                {answers: answers, comments: this.state.comments, CourseName: this.props.courseName, user_type:this.props.user_type},
                { headers: { 'Content-Type': 'application/json' } }
            )
            console.log(response.data)
            if(response.data === 'Failed')
                alert("ארעה שגיאה בשמירת הנתונים")
            else
                this.setState((currentState) => ({show_qestionnaire: !currentState.show_qestionnaire}))

        })();
    }


    render(){

        if(this.state.questions){
            var questions_arr =[]
            for(var i=0;i<this.state.questions.length;i++){//running over every property in object
                questions_arr.push(<p key={"p"+i}/>, <div key={'q'+i}>{this.state.questions[i].QuestionNum}. {this.state.questions[i].Question}</div>)   
                for(var j=1;j<11;j++){
                    questions_arr.push( <label key={"label"+i+"."+j}>{j}<Radio
                            checked={this.state['selectedValue'+(i+1)] == j}
                            onChange={this.handleChange.bind(this)}
                            value={j}
                            color="default"
                            name="radio-button-demo"
                            id={(i+1)+''}
                        />
                    </label>)
                }
            }
            questions_arr.push(<p key='p_comment'/>,<TextField
                    style={{width: 600}}
                    dir="rtl"
                    key="txt_comment"
                    name="comment"
                    id="outlined-textarea"
                    placeholder="הערות"
                    multiline
                    rows="3"
                    variant="outlined"
                    onChange={this.onCommentChange.bind(this)}
                  />)
        }

        return(
            <div dir = "rtl">
                {this.state.show_qestionnaire && <div>
                    <p/><b>שאלון</b><p/>
                    <div className="q-arr">{questions_arr}</div>
                    <button type="button"
                        className="save-btn"
                        onClick={this.submitQuestionnaire.bind(this)}>שמור</button>
                    </div>}
                {!this.state.show_qestionnaire && <h2>תודה ויום נעים!!!</h2>}
            </div>
        )
    }
}
