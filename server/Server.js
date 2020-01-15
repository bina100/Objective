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

var user_id = ''

function getCurrentDateAndTime(){
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();

  today = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + m + ':' + s
  return(today)
}

//-------------------------------------------------------------
function getLabDetails(course_code, semester, callback) {
  // var DateTime = getCurrentDateAndTime()
  var DateTime = '2008-12-19 16:00:00'

  var sql = "SELECT LabCode, LabNum, LabName from labs where DateTime = '"+DateTime+"' and CourseCode = "+course_code+" and Semester = "+semester+";"
  console.log('sql: ', sql)
  var query = db.query(sql, (err, result) => {
    // check result  
    console.log('result: ', result)
    if(err)
      callback(err)
    if(result === undefined){//if something went wrong while fetching
      console.log("return_lab_code- failed..")
      callback('Failed')
    }
    else{
      console.log('lab code: ', result)
      callback(result[0])
    }
  });
}

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
    var query = db.query(sql, function(err, result) {
      // check result
      if(result.length === 0){//if student doesn't exist in the system
        console.log("studentExist- failed..")
        res.end('Failed');
      }
      else{
        user_id = result[0].password
        res.end('Success');

      }
    });
  });

  //-----------------------------------------------------
  app.post('/return_user_name', function(req, res) {
    // Get sent data.
    var user = req.body
    var user_type = user.type
    if(user_type === undefined){
      res.end("no_type")
    }
    // Do a MySQL query.
    var sql = 'SELECT FirstName, LastName FROM ' + user_type + ' WHERE username = "'+user.username+'" and password = "'+user.password+'"'
    // Do a MySQL query.
    var query = db.query(sql, function(err, result) {
      // check result
      if(result.length === 0){//if student doesn't exist in the system
        console.log("return_user_name - failed..")
        res.end('Failed');
      }
      else{
        res.send(result[0]);//result comes as an array
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/load_students', function(req, res) {
    // Get sent data.
    var students = req.body.students//two dimention array
    console.log("students: ", students)

    for(var i=0;i<students.length;i++){//running over every student in matrix
      var sql = "INSERT INTO students(FirstName, LastName, Username, Password) values('"+students[i][0]+"','"+students[i][1]+ "', '"+students[i][2]+"', '"+students[i][3]+"');"
      console.log('query: ', sql)
      var query = db.query(sql, function(err, result) {
        // check result  
        if(err){
          console.log('err: ', err)
          res.end(JSON.stringify(err))
        }
        else if(result === undefined){//if something went wrong while inserting
          console.log("load_students- failed..")
          res.end('Failed');
        }
        else{
          console.log("load_students - success....")
          res.end('Success');
  
        }
      });
    } 
  });

  //-------------------------------------------------------------
  app.post('/push_student_qustionnaire_to_db', function(req, res) {
    // Get sent data.
    var questions = req.body.questions//object type in format {0: "question1", 1: question2", ...}
    var CourseCode = req.body.CourseCode
    //-------checking if this is first time inserting questionnaire for course-------------------------
    var sql = "SELECT Questionnaire_code FROM questionnaires WHERE Course_code = "+CourseCode+";"
    var query = db.query(sql, function(err, result) {
      if(result.length == 0){//if this is first time
        //-------adding row to questionnaires with new q_code------------------------
        var sql = "INSERT INTO Questionnaires(Course_code) values("+CourseCode+");"
        var query = db.query(sql, function(err, result) {
          // check result
          if(err){
            console.log('err!!!!!!!!!!!!!!!!: ', err.Error)
            if(err.Error == 'ER_DUP_ENTRY')
              console.log('err!!!!!!!!!!!!!!!!: ', err)
            else
              res.end(JSON.stringify(err))
          }
          else if(result === undefined){//if something went wrong while inserting
            console.log("push_qustionnaire_to_db- failed..")
            res.end('Failed');
          }
          //---------pushing questions into db--------------------------------
          else{
            for(var i=0;i<Object.keys(questions).length;i++){//running over every property in object
              var sql = "INSERT INTO student_questions(QuestionNum, Question, Questionnaire_code) values("+(i+1)+",'"+questions[i]+ "', (select Questionnaire_code from Questionnaires where Course_code = "+CourseCode+"));"
              console.log("sql2: ", sql)
              var query = db.query(sql, function(err, result) {
                // check result  
                if(err){
                  console.log('err: ', err)
                  res.end(JSON.stringify(err))
                }
                else if(result === undefined){//if something went wrong while inserting
                  console.log("push_qustionnaire_to_db- failed..")
                  res.end('Failed');
                }
                else{
                  console.log("push_qustionnaire_to_db - success....")
                  res.end('Success');
          
                }
              });
            } 
          }
        });
      }
      //---------------if not the first time--pushing questions into db--------------------------------
      else{
        for(var i=0;i<Object.keys(questions).length;i++){//running over every property in object
          var sql = "INSERT INTO student_questions(QuestionNum, Question, Questionnaire_code) values("+(i+1)+",'"+questions[i]+ "', (select Questionnaire_code from Questionnaires where Course_code = "+CourseCode+"));"
          console.log("sql2: ", sql)
          var query = db.query(sql, function(err, result) {
            // check result  
            if(err){
              console.log('err: ', err)
              res.end(JSON.stringify(err))
            }
            else if(result === undefined){//if something went wrong while inserting
              console.log("push_qustionnaire_to_db- failed..")
              res.end('Failed');
            }
            else{
              console.log("push_qustionnaire_to_db - success....")
              res.end('Success');
            }
          });
        } 
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/push_guide_qustionnaire_to_db', function(req, res) {
    // Get sent data.
    var questions = req.body.questions //object type in format {0: "question1", 1: question2", ...}
    var CourseCode = req.body.CourseCode
    var ranges = req.body.ranges //object with keys 2:9 and values-ranges
    console.log('CourseCode: ', CourseCode)
    //-------checking if this is first time inserting questionnaire for course-------------------------
    var sql = "SELECT Questionnaire_code FROM questionnaires WHERE Course_code = "+CourseCode+";"
    var query = db.query(sql, function(err, result) {
      if(result.length == 0){//if this is first time
        //-------adding row to questionnaires with new q_code------------------------
        var sql = "INSERT INTO Questionnaires(Course_code) values("+CourseCode+");"
        var query = db.query(sql, function(err, result) {
          // check result
          if(err){
            if(err.Error == 'ER_DUP_ENTRY')
              console.log('err!!!!!!!!!!!!!!!!: ', err)
            else
              res.end(JSON.stringify(err))
          }
          else if(result === undefined){//if something went wrong while inserting
            console.log("push_qustionnaire_to_db- failed..")
            res.end('Failed');
          }
          //---------pushing questions into db--------------------------------
          else{
            for(var i=0;i<Object.keys(questions).length;i++){//running over every property in object
              var range = 0
              if(i>=2 && i<=9)
                range = ranges[i]
              var sql = "INSERT INTO guide_questions(QuestionNum, Question, AnswerRange, Questionnaire_code) values("+(i+1)+",'"+questions[i]+ "', "+range+", (select Questionnaire_code from Questionnaires where Course_code = "+CourseCode+"));"
              console.log("sql2: ", sql)
              var query = db.query(sql, function(err, result) {
                // check result  
                if(err){
                  console.log('err: ', err)
                  res.end(JSON.stringify(err))
                }
                else if(result === undefined){//if something went wrong while inserting
                  console.log("push_qustionnaire_to_db- failed..")
                  res.end('Failed');
                }
                else{
                  console.log("push_qustionnaire_to_db - success....")
                  res.end('Success');
          
                }
              });
            } 
          }
        });
      }
      //---------------if not the first time--pushing questions into db--------------------------------
      else{
        for(var i=0;i<Object.keys(questions).length;i++){//running over every property in object
          var range = 0
          if(i>=2 && i<=9)
            range = ranges[i]
          var sql = "INSERT INTO guide_questions(QuestionNum, Question, AnswerRange, Questionnaire_code) values("+(i+1)+",'"+questions[i]+ "', "+range+", (select Questionnaire_code from Questionnaires where Course_code = "+CourseCode+"));"
          console.log("sql2: ", sql)
          var query = db.query(sql, function(err, result) {
            // check result  
            if(err){
              console.log('err: ', err)
              res.end(JSON.stringify(err))
            }
            else if(result === undefined){//if something went wrong while inserting
              console.log("push_qustionnaire_to_db- failed..")
              res.end('Failed');
            }
            else{
              console.log("push_qustionnaire_to_db - success....")
              res.end('Success');
            }
          });
        } 
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/return_course_data_per_user', function(req, res) {
    var course_name_arr = []
    var count_course // in order to send a response only after getting all queries results
    // Get sent data.
    var user = req.body
    if(user.type == 'students')    
      var active_course_code = 'select distinct LabCode from scheduling where StudentCode = '+ user.password
    if(user.type == 'guides')
      var active_course_code = 'select distinct LabCode from scheduling where GuideCode = '+ user.password
    var course_id=[]
    // Do a MySQL query.
    var query = db.query(active_course_code, function(err, result1) {
      // check result
      count_course = result1.length
      if(result1.length === 0){//if student isnt signed up to any courses
        console.log("return active code course - failed..")
        res.end('Failed');
      }
      else{
        for(var i = 0; i < result1.length; i++){
          var code_course = 'select CourseCode, Semester from Labs where LabCode = ' + result1[i].LabCode;
          // Do a MySQL query.
          var query_course_code = db.query(code_course, function(err, result2) {
            if(result2.length === 0){//if query failed
              console.log("return_code course - failed..")
              res.end('Failed');
            }
            else{
              course_id.push({CourseCode:result2[0].CourseCode, Semester:result2[0].Semester})
              console.log('courses_id1111111: ', result2)
              var course_name = 'select CourseName from courses where Course_code = ' + result2[0].CourseCode+" and Semester = "+ result2[0].Semester+";"
              console.log(course_name)
              var query_course_code = db.query(course_name, function(err, result3) {
                if(result3.length === 0){//if query failed
                  console.log("return- course name - failed..")
                  res.end('Failed');
                }
                else{
                  course_name_arr.push(result3[0].CourseName)//adding course to aourses array
                  count_course -- //counting how many results have returned
                  if(count_course === 0){// if all data was returned
                    res.end(JSON.stringify({courses_names:course_name_arr.toString(), courses_id:JSON.stringify(course_id)}))// returning string of studet's courses to client
                  }
                }
              });
            }
          });
        }  
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/return_course_qustionnaire', function(req, res) {
    // Get sent data.
    var CourseCode = req.body.CourseCode
    
    var sql = "SELECT Question, QuestionNum from student_questions where Questionnaire_code = (SELECT Questionnaire_code from questionnaires where Course_code = "+CourseCode+");"
    console.log('sql: ', sql)
    var query = db.query(sql, function(err, result) {
      // check result
      if(err){
        console.log('err: ', err)
        res.end(err)
      }
      if(result.length == 0){//if something went wrong while inserting
        console.log("return_course_qustionnaire- failed..")
        res.end('Failed');
      }
      else{
        console.log("return_course_qustionnaire - success....")
        console.log(result)
        res.end(JSON.stringify(result));

      }
    });
  });

  //-------------------------------------------------------------
  app.post('/return_all_courses', function(req, res) {
    var sql = "SELECT * from courses group by CourseName;"
    var query = db.query(sql, function(err, result) {
      // check result  
      if(result === undefined){//if something went wrong while fetching
        console.log("return_course_qustionnaire- failed..")
        res.end('Failed');
      }
      else{
        res.end(JSON.stringify(result));
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/return_all_guides', function(req, res) {
    var sql = "SELECT FirstName, LastName, Password from guides;"
    var query = db.query(sql, function(err, result) {
      // check result  
      if(err)
        res.end(err)
      if(result === undefined){//if something went wrong while fetching
        console.log("return_course_qustionnaire- failed..")
        res.end('Failed');
      }
      else{
        res.end(JSON.stringify(result));
      }
    });
  });
  
  //-------------------------------------------------------------
  
  app.post('/push_filled_s_qustionnaire_to_db', function(req, res) {
    // Get sent data.
    if(true){
      console.log("student id: ", user_id)
      var comments = req.body.comments//string
      var answers = req.body.answers
      var CourseName = req.body.CourseName
      var labNum
      console.log("CourseCode: ", req.body.CourseCode, ", semester: ", req.body.semester)
    }
    getLabDetails(req.body.CourseCode, req.body.semester, function (data, err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("lab details: ",data)
        labNum = data.LabNum
      }
    });
    var success = 0
    //-------inserting comments----------------------
    var sql = "INSERT INTO student_questionnaire(Questionnaire_code, StudentCode, QuestionNum, AnswerNum, LabNum) values((SELECT Questionnaire_code from questionnaires where Course_code = (SELECT Course_code FROM Courses where CourseName = '"+CourseName+"')), '"+user_id+"', "+0+", '"+comments+"', "+labNum+");"
    console.log("sql: ", sql)
    var query = db.query(sql, function(err, result) {
      // check result  
      if(err){
        res.end(JSON.stringify(err))
      }
      else if(result === undefined){//if something went wrong while inserting
        console.log("push_comments_to_db- failed..")
        res.end('Failed');
      }
      else{
        console.log("push_comments_to_db - success....")
        success++
        if(success == Object.keys(answers).length+1){
          console.log('done!!!!!!!')
          res.end('Success'); 
        }
      }
    });
    //-------inserting answers----------------------
    for(i=1;i<=Object.keys(answers).length;i++){//running over every property in object
      console.log("student id: ", user_id)
      var sql = "INSERT INTO student_questionnaire(Questionnaire_code, StudentCode, QuestionNum, AnswerNum, LabNum) values((SELECT Questionnaire_code from questionnaires where Course_code = (SELECT Course_code FROM Courses where CourseName = '"+CourseName+"')), '"+user_id+"', "+i+", "+answers[i]+", "+labNum+");"
      console.log("sql: ", sql)
      var query = db.query(sql, function(err, result) {
        // check result  
        if(result === err){
          console.log('err: ', err)
        }
        if(result === undefined){//if something went wrong while inserting
          console.log("push_filled_qustionnaire_to_db- failed..")
          res.end('Failed');
        }
        else{
          console.log("push_filled_qustionnaire_to_db - success....")
          success++
          if(success == Object.keys(answers).length+1){
            res.end('Success'); 
          }
        }
      });
    }

  });

  //-------------------------------------------------------------
  app.post('/push_filled_g_qustionnaire_to_db', function(req, res) {
    // Get sent data.
    if(true){
      var table = req.body.table//matrix
      var course = req.body.course
      console.log("table: ", table)
      var labNum
    }
    getLabDetails(course.CourseCode, course.Semester, function (data, err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("lab details: ",data)
        labNum = data.LabNum
        var sum = 0
        var q_code_res
        var q_code = "select Questionnaire_code from questionnaires where Course_code = "+course.CourseCode+";"
        var query = db.query(q_code, function(err, q_res) {
          // check result  
          if(err){
            console.log('err: ', err)
            res.end(JSON.stringify(err))
          }
          else{
            q_code_res = q_res[0].Questionnaire_code
            for(var i=1;i<table.length;i++){//running over every student in matrix
              for(var j=2;j<table[0].length;j++){
                    if(j==10){
                      console.log('@: ', table[i][j], " sum: ", sum)
                      var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values("+q_code_res+", "+user_id+", "+table[i][0]+", "+11+", "+sum+", "+labNum+");"
                    }
                    else{
                      var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values("+q_code_res+", "+user_id+", "+table[i][0]+", "+(j+1)+", "+table[i][j]+", "+labNum+");"
                      sum= (sum+parseInt(table[i][j]))
                      console.log("sum: ", sum)
                    }
                      console.log('query: ', sql)
                    var query = db.query(sql, function(err, result) {
                      // check result  
                      if(err){
                        console.log('err: ', err)
                        res.end(JSON.stringify(err))
                      }
                      else if(result === undefined){//if something went wrong while inserting
                        console.log("load_students- failed..")
                        res.end('Failed');
                      }
                      else{
                        if(j == table[0].length){
                          j++
                          var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values("+q_code_res+", "+user_id+", "+table[i-1][0]+", "+12+", "+table[i-1][10]+", "+labNum+");"
                          var query = db.query(sql, function(err, result) {
                            // check result  
                            if(err){
                              console.log('err: ', err)
                              res.end(JSON.stringify(err))
                            }
                            else if(result === undefined){//if something went wrong while inserting
                              console.log("load_students- failed..")
                              res.end('Failed');
                            }
                            else{
                              console.log("push_guide_qustionnaire_to_db - success....")
                              res.end('Success');
                            }
                        });
                        }
                      }
                  });
              }
            } 
          }
        });
      }
    });
  });

  //-----------------------------------------------------
  app.post('/return_course_follow_up', function(req, res) {
    var student_table=[], guide_table=[]
    var user = req.body
    var return_questionnaire_code = 'SELECT Questionnaire_code FROM questionnaires WHERE Course_code = '+user.course_code+';'
    var query = db.query(return_questionnaire_code, function(err, res_q_code) {
      console.log("RESULT IS - return_questionnaire_code ",res_q_code,err);
      if(err)
        console.log('err', err)
      else if(res_q_code.length === 0){ //if failed to fetch questionnaire code
        console.log("return_questionnaire_code- failed..")
        res.end('Failed');
      }
      else{ //-------------fetching lab code---------------------//
        var return_lab_code = 'SELECT LabCode FROM labs WHERE CourseCode = '+user.course_code+' and semester = '+user.semester+' and LabNum = '+user.lab_num+';'
        console.log('sql: ', return_lab_code)
        var query = db.query(return_lab_code, function(err, res_lab_code) {
          console.log("RESULT IS - return_active_course_code ",res_lab_code,err);
          if(err)
            console.log('err', err)
          else if(res_lab_code.length === 0){//if failed to fetch active course code
            console.log(" return_active_course_code- failed..")
            res.end('Failed');
          }
          else{//--------fetching sudent and guide codes---------------------------------------------
            var lab_code = res_lab_code[0].LabCode
            var return_student_guide_pairs = 'SELECT distinct StudentCode, GuideCode FROM scheduling WHERE LabCode = '+lab_code+';'
            console.log("QUERY: ", return_student_guide_pairs)
            // Do a MySQL query.
            var query = db.query(return_student_guide_pairs, function(err, res_s_g) {
              console.log("result-return_student_guide_pairs: ",res_s_g)
              if(err)
                console.log('err', err)
              else if(res_s_g.length === 0){
                console.log(" - failed..")
                res.end('Failed');
              }
              else{
                var i_object={}
                var i=0, student_count=0, guide_count=0
                for(i; i<res_s_g.length; i++){
                  j=i
                  //-------fetching student details--------------//
                  var return_student_details = 'SELECT FirstName, LastName, Password FROM students WHERE Password = '+res_s_g[i].StudentCode+';'
                  console.log('query: ', return_student_details)
                  var query = db.query(return_student_details, function(err, res_s_d) {
                    console.log("result-return_student_details: ",res_s_d)
                    if(err)
                      console.log('err', err)
                    else if(res_s_d.length === 0){//if student doesn't exist in the system
                      console.log("return_student_details - failed..")
                      res.end('Failed');
                    }
                    else{
                      student_table.push({name:res_s_d[0].FirstName +' '+res_s_d[0].LastName, id:res_s_d[0].Password})
                      console.log('came back from fetching student d')
                    }
                  });
                  //-------fetching student answers--------------//
                  var return_student_questionnaire = 'SELECT QuestionNum, AnswerNum FROM student_questionnaire WHERE Questionnaire_code = '+res_q_code[0].Questionnaire_code+' and StudentCode = '+res_s_g[i].StudentCode+' and LabNum = '+user.lab_num+';'
                  var query = db.query(return_student_questionnaire, function(err, res_s_q) {
                    console.log("result-return_student_questionnaire: ",res_s_q)
                    if(err)
                      console.log('err', err)
                    else if(res_s_q.length === 0){//if student doesn't exist in the system
                      console.log("return_student_questionnaire - failed..")
                      res.end('Failed');
                    }
                    else{
                      student_table.push({student:res_s_q})
                      student_count++
                      console.log('came back from fetching student q')
                    }
                  });
                   //-------fetching guide details--------------//
                   var return_guide_details = 'SELECT FirstName, LastName, Password FROM guides WHERE Password = '+res_s_g[i].GuideCode+';'
                   console.log('query: ', return_guide_details)
                   var query = db.query(return_guide_details, function(err, res_g_d) {
                     console.log("result-return_guide_details: ",res_g_d)
                     if(err)
                       console.log('err', err)
                     else if(res_g_d.length === 0){//if student doesn't exist in the system
                       console.log("return_guide_details - failed..")
                       res.end('Failed');
                     }
                     else{
                       guide_table.push({name:res_g_d[0].FirstName +' '+res_g_d[0].LastName, id:res_g_d[0].Password})
                       console.log('came back from fetching guide d')
                     }
                   });
                  //-------fetching guide answers--------------//
                  var return_guide_questionnaire = 'SELECT QuestionNum, AnswerNum FROM guide_questionnaire WHERE Questionnaire_code = '+res_q_code[0].Questionnaire_code+' and GuideCode = '+ res_s_g[i].GuideCode+' and StudentCode = '+res_s_g[i].StudentCode+' and LabNum = '+user.lab_num+';'
                  var query = db.query(return_guide_questionnaire, function(err, res_g_q) {
                    console.log("result-return_guide_questionnaire: ",res_g_q)
                    if(err)
                      console.log('err', err)
                    else if(res_g_q.length === 0){//if student doesn't exist in the system
                      console.log("return_guide_questionnaire - failed..")
                      res.end('Failed');
                    }
                    else{
                      console.log('came back from fetching guide q')
                      guide_table.push({guide:res_g_q})
                      guide_count++
                      if(student_count === res_s_g.length && guide_count === res_s_g.length){
                        console.log('guide_table: ', guide_table, '\n\n')
                        console.log('student_table: ', student_table)
                        res.send({guide_table:guide_table, student_table:student_table})
                      }
                    }
                  }); 
                }//while
              }
            });//res_s_g
          }
        });//res_ac_code
      }
    });//res_q_code   
  });//post

  
  //-------------------------------------------------------------
  app.post('/fetch_answer_ranges_per_g_q', function(req, res) {
    course_code = req.body.CourseCode
    var sql = "SELECT AnswerRange from guide_questions where Questionnaire_code = (select Questionnaire_code from questionnaires where Course_code = "+course_code+");"
    var query = db.query(sql, function(err, result) {
      // check result  
      if(result === undefined){//if something went wrong while fetching
        console.log("fetch_answer_ranges_per_g_q- failed..")
        res.end('Failed');
      }
      else{
        res.end(JSON.stringify(result));
      }
    });
  });

  //-------------------------------------------------------------
  app.post('/return_guide_questionnaire', function(req, res) {
  // Get sent data.
  console.log("student id: ", user_id)
  var CourseCode = req.body.CourseCode

  var sql = "select QuestionNum, Question, AnswerRange from guide_questions where Questionnaire_code = (select Questionnaire_code from questionnaires where Course_code = "+CourseCode+");"
  console.log("sql: ", sql)
  var query = db.query(sql, function(err, result) {
    // check result  
    if(result === undefined){//if something went wrong while inserting
      console.log("return_all_students_per_guide- failed..")
      res.end('Failed');
    }
    else{
      console.log("return_all_students_per_guide - success....")
      console.log('result: ', result)
      res.end(JSON.stringify(result));
    }
  });
});

//-----------------------------------------------------
app.post('/returns_students_per_guide_and_lab', function(req, res) {
  // Get sent data.
  if(true){
    var course = req.body.course
    var labCode
    console.log('CourseCode: ', course.CourseCode)
  }

  getLabDetails(course.CourseCode, course.Semester, function (data, err) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("lab details: ",data, ", ", data.LabNum)
      labCode = data.LabCode
      var return_student_codes = 'SELECT StudentCode from scheduling where GuideCode = "'+user_id+'" and LabCode = '+labCode+';'
      // Do a MySQL query.
      console.log('sql: ', return_student_codes)
      var query = db.query(return_student_codes, function(err, res_students) {
        // check result
        if(err){
          console.log('err: ', err)
          res.end(JSON.stringify(err))
        }
        else if(res_students.length === 0){//if student doesn't exist in the system
          console.log("return_students - failed..")
          res.end('Failed');
        }
        else{
          var count = res_students.length
          var studentsArr = []
          console.log("return_students: ", res_students[0])
          for(var i=0;i<res_students.length;i++){
            var studentPwd = res_students[i].StudentCode
            console.log('studentPwd: ', studentPwd)
            var return_student_name = 'SELECT FirstName, LastName FROM students where Password = '+studentPwd+';'
            console.log('sql: ', return_student_name)
            var query = db.query(return_student_name, function(err, res_student_name) {
              // check result
              if(res_student_name.length === 0){//if student doesn't exist in the system
                console.log("res_student_name - failed..")
                res.end('Failed');
              }
              else{
                console.log('res_student_name ',i, res_student_name)
                studentsArr.push({FirstName:res_student_name[0].FirstName, LastName:res_student_name[0].LastName, Password: studentPwd})
                count--
                if(count === 0)
                  res.end(JSON.stringify(studentsArr))
              }
            });
          }
          // res.send(result[0]);//result comes as an array
        }
      });
    }
  });
});

app.listen('5000', ()=>{
    console.log('app running on port 5000')
})