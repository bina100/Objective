const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express(); 

///maybe- check loopback?

app.use(bodyParser.json({extended: false}))

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Bina&Nechama',
    database: 'objective_tools'
});

 
db.connect((err)=>{
    if(err){
        console.log("my sql1 "+ err);
    }
    else
    console.log('mysql connected...');
});



var student_id = ''

app.get('/abc', (req, res)=>{
    console.log("hello");
    let sql1 = 'SELECT * FROM student';
    let qury1 = db.query(sql1, (err, result)=>{
        if(err) console.log("my sql3 "+ err);
            console.log(result);
            res.send('database1 connected...');
    });
    //let sql = 'CREATE DATABASE abc';
    //console.log("my database "+ sql1);
    // db.query(sql, (err, result)=>{
    //     if(err) console.log("my sql2 "+ err);
    //     res.send('database connected...');
    // })
});

app.post('/userExist', function(req, res) {
    // Get sent data.
    var user = req.body;
    //define user type
    var user_type; //definning user type in order to know what table to check existance
    if(user.type === 'Student')
      user_type = 'students'
    else if(user.type === 'Guide')
      user_type = 'guides'
    else if((user.type === 'Admin'))
      user_type = 'admin'
    else if((user.type === 'Director'))
      user_type = 'director'
    if(user_type === undefined){
      console.log("userExist - no type")
      res.end("no_type")
      return
    }
      console.log("username: ", user.username, " pwd: ", user.password, " type: ", user.type)
    // Do a MySQL query.
    var sql = 'SELECT username, password FROM ' + user_type + ' WHERE username = "'+user.username+'" and password = "'+user.password+'"'
    console.log("QUERY: ", sql)
    var query = db.query(sql, function(err, result) {
      // check result
      console.log("result-studentExist: ",result)

      if(result.length === 0){//if student doesn't exist in the system
        console.log("studentExist- failed..")
        res.end('Failed');
      }
      else{
        student_id = result[0].password
        console.log("pwd: ", student_id)
        console.log("RESULT IS -studentExist",result,err);
        console.log("studentExist - success....")
        res.end('Success');

      }
    });
    console.log("hello ..."+ query);
  });
  //-----------------------------------------------------
  app.post('/return_user_name', function(req, res) {
    console.log("hello return_user_name")
    // Get sent data.
    var user = req.body
    var user_type = user.type
    if(user_type === undefined){
      console.log("return_user_name - no type")
      res.end("no_type")
    }
    console.log("username: ", user.username, " pwd: ", user.password, " type: "+ user.type)
    // Do a MySQL query.
    var sql = 'SELECT FirstName, LastName FROM ' + user_type + ' WHERE username = "'+user.username+'" and password = "'+user.password+'"'
    console.log("QUERY: ", sql)
    // Do a MySQL query.
    var query = db.query(sql, function(err, result) {
      // check result
      //console.log("result-return_user_name: ",result)

      if(result.length === 0){//if student doesn't exist in the system
        console.log("return_user_name - failed..")
        res.end('Failed');
      }
      else{
        console.log("RESULT IS - return_user_name ",result,err);
        console.log("return_user_name - success....")
        res.send(result[0]);//result comes as an array

      }
    });
  });

  //-------------------------------------------------------------
  app.post('/return_course_data_per_student', function(req, res) {
    console.log("hello return_course_data_per_student")
    var course_name_arr = []
    var count_course // in order to send a response only after getting all queries results
    // Get sent data.
    var user = req.body
    // Do a MySQL query.
    var active_course_code = 'select distinct Active_Course_code from lab_meeting where StudentCode = '+ user.password
    // Do a MySQL query.
    var query = db.query(active_course_code, function(err, result1) {
      // check result
      console.log("result1: ",result1)
      count_course = result1.length
      if(result1.length === 0){//if student isnt signed up to any courses
        console.log("return active code course - failed..")
        res.end('Failed');
      }
      else{
        for(var i = 0; i < result1.length; i++){
          var code_course = 'select CourseCode from active_course where Active_Course_code = ' + result1[i].Active_Course_code;
          // Do a MySQL query.
          var query_course_code = db.query(code_course, function(err, result2) {
            console.log("RESULT 2 IS - return code course ",result2,err);
            if(result2.length === 0){//if query failed
              console.log("return_code course - failed..")
              res.end('Failed');
            }
            else{
              var course_name = 'select CourseName from courses where Course_code = ' + result2[0].CourseCode;
              var query_course_code = db.query(course_name, function(err, result3) {
                console.log("RESULT 3 IS - return_course name ",result3,err);
                if(result3.length === 0){//if query failed
                  console.log("return_= course name - failed..")
                  res.end('Failed');
                }
                else{
                  course_name_arr.push(result3[0].CourseName)//adding course to aourses array
                  count_course -- //counting how many results have returned
                  if(count_course === 0)// if all data was returned
                    res.end(course_name_arr.toString())// returning string of studet's courses to client
                }
              });
            }
          });
        }  
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/push_qustionnaire_to_db', function(req, res) {
    // Get sent data.
    var questions = req.body.questions//object type in format {0: "question1", 1: question2", ...}
    var CourseName = req.body.CourseName
    console.log("questions: ", questions)
    console.log("course name: ", CourseName)

    for(i=0;i<Object.keys(questions).length;i++){//running over every property in object
      var sql = "INSERT INTO questions(QuestionNum, Question, Questionnaire_code) values("+(i+1)+",'"+questions[i]+ "', (select Questionnaire_code from Questionnaires where Course_code = (select Course_code from courses where CourseName = '"+CourseName+"')));"
      var query = db.query(sql, function(err, result) {
        // check result  
        if(result === undefined){//if something went wrong while inserting
          console.log("push_qustionnaire_to_db- failed..")
          res.end('Failed');
        }
        else{
          console.log("push_qustionnaire_to_db - success....")
          res.end('Success');
  
        }
      });
    } 
  });

    //-------------------------------------------------------------
    app.post('/return_course_qustionnaire', function(req, res) {
      // Get sent data.
      var CourseName = req.body.CourseName
      console.log("course name: ", CourseName)
      
      var sql = "SELECT Question, QuestionNum from questions where Questionnaire_code = (SELECT Questionnaire_code from questionnaires where Course_code = (SELECT Course_code FROM Courses where CourseName = '"+CourseName+"'));"
      var query = db.query(sql, function(err, result) {
        // check result  
        if(result === undefined){//if something went wrong while inserting
          console.log("return_course_qustionnaire- failed..")
          res.end('Failed');
        }
        else{
          console.log("return_course_qustionnaire - success....")
          res.end(JSON.stringify(result));
  
        }
      });
    });

  //-------------------------------------------------------------
  app.post('/return_all_courses', function(req, res) {
    var sql = "SELECT * from courses;"
    var query = db.query(sql, function(err, result) {
      // check result  
      if(result === undefined){//if something went wrong while fetching
        console.log("return_course_qustionnaire- failed..")
        res.end('Failed');
      }
      else{
        console.log("return_course_qustionnaire - success....")
        console.log("return_all_courses- result: ", result)
        res.end(JSON.stringify(result));
      }
    });
  });
  
  //-------------------------------------------------------------
  app.post('/push_filled_qustionnaire_to_db', function(req, res) {
    // Get sent data.
    console.log("student id: ", student_id)
    var comments = req.body.comments//object type in format {0: "question1", 1: question2", ...}
    var answers = req.body.answers
    var CourseName = req.body.CourseName
    console.log("comments: ", comments)
    console.log("answers: ", answers)

    for(i=1;i<=Object.keys(answers).length;i++){//running over every property in object
      if(!comments[i])
        comments[i]=""
      console.log("student id: ", student_id)
      var sql = "INSERT INTO student_questionnaire(Questionnaire_code, StudentCode, QuestionNum, AnswerNum, LabNum, comment) values((SELECT Questionnaire_code from questionnaires where Course_code = (SELECT Course_code FROM Courses where CourseName = '"+CourseName+"')), '"+student_id+"', "+i+", "+answers[i]+", 1, '"+comments[i]+"');"
      console.log("sql: ", sql)
      var query = db.query(sql, function(err, result) {
        // check result  
        if(result === undefined){//if something went wrong while inserting
          console.log("push_filled_qustionnaire_to_db- failed..")
          res.end('Failed');
        }
        else{
          console.log("push_filled_qustionnaire_to_db - success....")
          res.end('Success');
  
        }
      });
    } 
  });

app.listen('5000', ()=>{
    console.log('app running on port 5000')
})