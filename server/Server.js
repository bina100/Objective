const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express(); 

///maybe- check loopback?

app.use(bodyParser.json({extended: false}))

//app.use(express.static('./src/Login.js'))

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

  

app.listen('5000', ()=>{
    console.log('app running on port 5000')
})