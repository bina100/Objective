const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const accessTokenManeger = require('./AccessToken')
// const findToken=accessTokenManeger.getTokenFromReq;
///maybe- check loopback?

app.use(express.static(path.join(__dirname, 'build')));
app.set('views', path.join(__dirname, '../build'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.listen('5000', () => {
  console.log('app running on port 5000')
})

app.use(bodyParser.json({ extended: false }))
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'student',
  database: 'objective_tools'
});

const AccessTokenManeger = new accessTokenManeger(db);
app.tokenManager=AccessTokenManeger;
// AccessTokenManeger.getTokenFromReq({query:{access_token:"fjsipjfpsd"}})
app.use('/',function(req,res,next){
  app.tokenManager.getTokenFromReq(req,res,next);
});
db.connect((err) => {
  if (err) {
    console.log("my sql1 " + err);
  }
  else
  console.log('mysql connected...');
});

var user_id = ''

function getCurrentDateAndTime() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();

  today = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + m + ':' + s
  return (today)
}

//-------------------------------------------------------------
// returns LabCode and LabNum according to Date&Time, CourseCode and Semester
function getLabDetails(course_code, semester, callback) {
  // var DateTime = getCurrentDateAndTime()
  // var DateTime = '2008-12-19 16:00:00'
  var DateTime = '2020-01-23 15:40:00'

  var sql = "SELECT LabCode, LabNum from labs where DateTime = '" + DateTime + "' and CourseCode = " + course_code + " and Semester = " + semester + ";"
  console.log('sql: ', sql)
  var query = db.query(sql, (err, result) => {
    // check result  
    console.log('result: ', result)
    if (err)
      callback(err)
    if (result === undefined) {//if something went wrong while fetching
      console.log("return_lab_code- failed..")
      callback('Failed')
    }
    if (result.length === 0)
      callback(-1)
    else {
      console.log('lab code: ', result)
      callback(result[0])
    }
  });
}

app.post('/userExist', function (req, res) {
  // Get sent data.
  var user = req.body;
  //define user type
  var user_type; //definning user type in order to know what table to check existance
  if (user.type === 'Student')
    user_type = 'students'
  else if (user.type === 'Guide')
    user_type = 'guides'
  else if ((user.type === 'Admin'))
    user_type = 'admin'
  else if ((user.type === 'Director'))
    user_type = 'director'
  if (user_type === undefined) {
    console.log("userExist - no type")
    res.end("no_type")
    return
  }
  console.log("username: ", user.username, " pwd: ", user.password, " type: ", user.type)
  // Do a MySQL query.
  var sql = 'SELECT username, password FROM ' + user_type + ' WHERE username = "' + user.username + '" and password = "' + user.password + '"'
  var query = db.query(sql, async function (err, result) {
    // check result
    if (result.length === 0) {//if student doesn't exist in the system
      console.log("studentExist- failed..")
      res.end('Failed');
    }
    else {
      user_id = result[0].password
      //create accessToken 
      try {
        let token = await AccessTokenManeger.createToken(user.username, user.type);
        console.log("token:", token);
        //TODO- set for 1 hour.
        res.cookie('access_token', token.token,{});
        res.end('Success');
      } catch (er) { 
        console.error(er);
        res.end("Failed");
      }
    }
  });
});

//-----------------------------------------------------
app.post('/return_user_name', function (req, res) {
  // Get sent data.
  var user = req.body
  var user_type = user.type
  if (user_type === undefined) {
    res.end("no_type")
  }
  // Do a MySQL query.
  var sql = 'SELECT FirstName, LastName FROM ' + user_type + ' WHERE username = "' + user.username + '" and password = "' + user.password + '"'
  // Do a MySQL query.
  var query = db.query(sql, function (err, result) {
    // check result
    if (result.length === 0) {//if student doesn't exist in the system
      console.log("return_user_name - failed..")
      res.end('Failed');
    }
    else {
      res.send(result[0]);//result comes as an array
    }
  });
});

//-----------------------------------------------------
app.post('/delete_user', function (req, res) {
  // Get sent data.
  var user_type = req.body.user_type
  var id = req.body.id

  if(user_type == "students"){
    var student ='select * from student_questionnaire where StudentCode = "' + id + '";'
    var query = db.query(student, function (err, result) {
      console.log("111111133333" ,err)
      if(err == null){
        console.log("empty")
      }
      // check result
      else if (err) {//if student doesn't exist in the system
        console.log("delete user - failed..")
        res.end('Failed');
      }
      else if (result.affectedRows == 0)
        res.end('Failed')
      else{
        res.end('Student deleted')
      }
    });
  
    
    var student_q = 'delete from student_questionnaire where StudentCode = "' + id + '";'
    console.log("qs ",student_q)
    // Do a MySQL query.
    var query = db.query(student_q, function (err, result) {
      // check result
      if (err) {//if student doesn't exist in the system
        console.log("delete user - failed..")
        res.end('Failed');
      }
      else if (result.affectedRows == 0)
        res.end('Failed')
      else{
        var guide_q ='delete from guide_questionnaire where StudentCode = "' + id + '";'
        console.log("qg ",guide_q)
        // Do a MySQL query.
        var query = db.query(guide_q, function (err, result) {
          // check result
          if (err) {//if student doesn't exist in the system
            console.log("delete user - failed..")
            res.end('Failed');
          }
          else if (result.affectedRows == 0)
            res.end('Failed')
          else{
            var schedul_q = 'delete from scheduling where StudentCode = "' + id + '";'
            console.log("qc ",schedul_q)
            // Do a MySQL query.
            var query = db.query(schedul_q, function (err, result) {
              // check result
              if (err) {//if student doesn't exist in the system
                console.log("delete user - failed..")
                res.end('Failed');
              }
              else if (result.affectedRows == 0)
                res.end('Failed')
              else{
                // Do a MySQL query.
                var sql = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";'
                console.log("q ",sql)
                // Do a MySQL query.
                var query = db.query(sql, function (err, result) {
                  // check result
                  if (err) {//if student doesn't exist in the system
                    console.log("delete user - failed..")
                    res.end('Failed');
                  }
                  else if (result.affectedRows == 0)
                    res.end('Failed')
                  // else{
                  //   res.end('Student deleted')
                  // }
                });
              }
            });
          }
        });
      }
    });
    
  }
  else if(user_type=="guides"){
    var guide_q = 'delete from guide_questionnaire where GuideCode = "' + id + '";'
    console.log("qg ",guide_q)
    // Do a MySQL query.
    var query = db.query(guide_q, function (err, result) {
      // check result
      if (err) {//if guide doesn't exist in the system
        console.log("delete user - failed..")
        res.end('Failed');
      }
      else if (result.affectedRows == 0)
        res.end('Failed')
      else{
        var guide_sch ='delete from scheduling where GuideCode = "' + id + '";'
        console.log("qg ",guide_sch)
        // Do a MySQL query.
        var query = db.query(guide_sch, function (err, result) {
          // check result
          if (err) {//if guide doesn't exist in the system
            console.log("delete user - failed..")
            res.end('Failed');
          }
          else if (result.affectedRows == 0)
            res.end('Failed')
          else{
            var guide_p = 'delete from guides where Password = ""' + id + '";'
            console.log("qc ",guide_p)
            // Do a MySQL query.
            var query = db.query(guide_p, function (err, result) {
              // check result
              if (err) {//if student doesn't exist in the system
                console.log("delete user - failed..")
                res.end('Failed');
              }
              else if (result.affectedRows == 0)
                res.end('Failed')
              else{
                // Do a MySQL query.
                var sql = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";'
                console.log("q ",sql)
                // Do a MySQL query.
                var query = db.query(sql, function (err, result) {
                  // check result
                  if (err) {//if student doesn't exist in the system
                    console.log("delete user - failed..")
                    res.end('Failed');
                  }
                  else if (result.affectedRows == 0)
                    res.end('Failed')
                  // else{
                  //   res.end('Student deleted')
                  // }
                });
              }
            });
          }
        });
      }
    });
    
  }
  else{
    var director_c = 'delete from courses where DirectorCode = "' + id + '";'
    console.log("qg ",director_c)
    // Do a MySQL query.
    var query = db.query(director_c, function (err, result) {
      // check result
      if (err) {//if director doesn't exist in the system
        console.log("delete user - failed..")
        res.end('Failed');
      }
      else if (result.affectedRows == 0)
        res.end('Failed')
      else{
        var director_p ='delete from director where Password = "' + id + '";'
        console.log("qg ",director_p)
        // Do a MySQL query.
        var query = db.query(director_p, function (err, result) {
          // check result
          if (err) {//if director doesn't exist in the system
            console.log("delete user - failed..")
            res.end('Failed');
          }
          else if (result.affectedRows == 0)
            res.end('Failed')
          else{
            // Do a MySQL query.
            var sql = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";'
            console.log("q ",sql)
            // Do a MySQL query.
            var query = db.query(sql, function (err, result) {
              // check result
              if (err) {//if student doesn't exist in the system
                console.log("delete user - failed..")
                res.end('Failed');
              }
              else if (result.affectedRows == 0)
                res.end('Failed')
              // else{
              //   res.end('Student deleted')
              // }
            });
          }
        });
      }
    });
    
  }
});

//-------------------------------------------------------------
app.post('/load_students', function (req, res) {
  // Get sent data.
  var students = req.body.students//two dimention array
  console.log("students: ", students)

  for (var i = 0; i < students.length; i++) {//running over every student in matrix
    var sql = "INSERT INTO students(FirstName, LastName, Username, Password) values('" + students[i][0] + "','" + students[i][1] + "', '" + students[i][2] + "', '" + students[i][3] + "');"
    console.log('query: ', sql)
    var query = db.query(sql, function (err, result) {
      // check result  
      if (err) {
        console.log('err: ', err)
        res.end(JSON.stringify(err))
      }
      else if (result === undefined) {//if something went wrong while inserting
        console.log("load_students- failed..")
        res.end('Failed');
      }
      else {
        console.log("load_students - success....")
        res.end('Success');

      }
    });
  }
});

//-------------------------------------------------------------
app.post('/load_guides', function (req, res) {
  // Get sent data.
  var guides = req.body.guides//two dimention array
  console.log("guides: ", guides)

  for (var i = 0; i < guides.length; i++) {//running over every guide in matrix
    var sql = "INSERT INTO guides(FirstName, LastName, Username, Password) values('" + guides[i][0] + "','" + guides[i][1] + "', '" + guides[i][2] + "', '" + guides[i][3] + "');"
    console.log('query: ', sql)
    var query = db.query(sql, function (err, result) {
      // check result  
      if (err) {
        console.log('err: ', err)
        res.end(JSON.stringify(err))
      }
      else if (result === undefined) {//if something went wrong while inserting
        console.log("load_guides- failed..")
        res.end('Failed');
      }
      else {
        console.log("load_guides - success....")
        res.end('Success');

      }
    });
  }
});
//-------------------------------------------------------------
app.post('/load_directores', function (req, res) {
  // Get sent data.
  var directores = req.body.directores//two dimention array
  console.log("directores: ", directores)

  for (var i = 0; i < directores.length; i++) {//running over every guide in matrix
    var sql = "INSERT INTO director(FirstName, LastName, Username, Password) values('" + directores[i][0] + "','" + directores[i][1] + "', '" + directores[i][2] + "', '" + directores[i][3] + "');"
    console.log('query: ', sql)
    var query = db.query(sql, function (err, result) {
      // check result  
      if (err) {
        console.log('err: ', err)
        res.end(JSON.stringify(err))
      }
      else if (result === undefined) {//if something went wrong while inserting
        console.log("load_directores- failed..")
        res.end('Failed');
      }
      else {
        console.log("load_directores - success....")
        res.end('Success');

      }
    });
  }
});

//-------------------------------------------------------------
app.post('/push_student_qustionnaire_to_db', function (req, res) {
  // Get sent data.
  var questions = req.body.questions//object type in format {0: "question1", 1: question2", ...}
  var CourseCode = req.body.CourseCode
  //-------checking if this is first time inserting questionnaire for course-------------------------
  var sql = "SELECT Questionnaire_code FROM questionnaires WHERE Course_code = " + CourseCode + ";"
  var query = db.query(sql, function (err, result) {
    if (result.length == 0) {//if this is first time
      //-------adding row to questionnaires with new q_code------------------------
      var sql = "INSERT INTO Questionnaires(Course_code) values(" + CourseCode + ");"
      var query = db.query(sql, function (err, result) {
        // check result
        if (err) {
          res.end(JSON.stringify(err))
        }
        else if (result === undefined) {//if something went wrong while inserting
          console.log("push_qustionnaire_to_db- failed..")
          res.end('Failed');
        }
        //---------pushing questions into db--------------------------------
        else {
          for (var i = 0; i < Object.keys(questions).length; i++) {//running over every property in object
            var sql = "INSERT INTO student_questions(QuestionNum, Question, Questionnaire_code) values(" + (i + 1) + ",'" + questions[i] + "', (select Questionnaire_code from Questionnaires where Course_code = " + CourseCode + "));"
            console.log("sql2: ", sql)
            var query = db.query(sql, function (err, result) {
              // check result  
              if (err) {
                console.log('err: ', err)
                res.end(JSON.stringify(err))
              }
              else if (result === undefined) {//if something went wrong while inserting
                console.log("push_qustionnaire_to_db- failed..")
                res.end('Failed');
              }
              else {
                console.log("push_qustionnaire_to_db - success....")
                res.end('Success');

              }
            });
          }
        }
      });
    }
    //---------------if not the first time--pushing questions into db--------------------------------
    else {
      for (var i = 0; i < Object.keys(questions).length; i++) {//running over every property in object
        var sql = "INSERT INTO student_questions(QuestionNum, Question, Questionnaire_code) values(" + (i + 1) + ",'" + questions[i] + "', (select Questionnaire_code from Questionnaires where Course_code = " + CourseCode + "));"
        console.log("sql2: ", sql)
        var query = db.query(sql, function (err, result) {
          // check result  
          if (err) {
            console.log('err: ', err)
            res.end(JSON.stringify(err))
          }
          else if (result === undefined) {//if something went wrong while inserting
            console.log("push_qustionnaire_to_db- failed..")
            res.end('Failed');
          }
          else {
            console.log("push_qustionnaire_to_db - success....")
            res.end('Success');
          }
        });
      }
    }
  });
});

//-------------------------------------------------------------
app.post('/push_guide_qustionnaire_to_db', function (req, res) {
  // Get sent data.
  var questions = req.body.questions //object type in format {0: "question1", 1: question2", ...}
  var CourseCode = req.body.CourseCode
  var ranges = req.body.ranges //object with keys 2:9 and values-ranges
  console.log('CourseCode: ', CourseCode)
  //-------checking if this is first time inserting questionnaire for course-------------------------
  var sql = "SELECT Questionnaire_code FROM questionnaires WHERE Course_code = " + CourseCode + ";"
  var query = db.query(sql, function (err, result) {
    if (result.length == 0) {//if this is first time
      //-------adding row to questionnaires with new q_code------------------------
      var sql = "INSERT INTO Questionnaires(Course_code) values(" + CourseCode + ");"
      var query = db.query(sql, function (err, result) {
        // check result
        if (err) {
          if (err.Error == 'ER_DUP_ENTRY')
            console.log('err!!!!!!!!!!!!!!!!: ', err)
          else
            res.end(JSON.stringify(err))
        }
        else if (result === undefined) {//if something went wrong while inserting
          console.log("push_qustionnaire_to_db- failed..")
          res.end('Failed');
        }
        //---------pushing questions into db--------------------------------
        else {
          for (var i = 0; i < Object.keys(questions).length; i++) {//running over every property in object
            var range = 0
            if (i >= 2 && i <= 9)
              range = ranges[i]
            var sql = "INSERT INTO guide_questions(QuestionNum, Question, AnswerRange, Questionnaire_code) values(" + (i + 1) + ",'" + questions[i] + "', " + range + ", (select Questionnaire_code from Questionnaires where Course_code = " + CourseCode + "));"
            console.log("sql2: ", sql)
            var query = db.query(sql, function (err, result) {
              // check result  
              if (err) {
                console.log('err: ', err)
                res.end(JSON.stringify(err))
              }
              else if (result === undefined) {//if something went wrong while inserting
                console.log("push_qustionnaire_to_db- failed..")
                res.end('Failed');
              }
              else {
                console.log("push_qustionnaire_to_db - success....")
                res.end('Success');

              }
            });
          }
        }
      });
    }
    //---------------if not the first time--pushing questions into db--------------------------------
    else {
      for (var i = 0; i < Object.keys(questions).length; i++) {//running over every property in object
        var range = 0
        if (i >= 2 && i <= 9)
          range = ranges[i]
        var sql = "INSERT INTO guide_questions(QuestionNum, Question, AnswerRange, Questionnaire_code) values(" + (i + 1) + ",'" + questions[i] + "', " + range + ", (select Questionnaire_code from Questionnaires where Course_code = " + CourseCode + "));"
        console.log("sql2: ", sql)
        var query = db.query(sql, function (err, result) {
          // check result  
          if (err) {
            console.log('err: ', err)
            res.end(JSON.stringify(err))
          }
          else if (result === undefined) {//if something went wrong while inserting
            console.log("push_qustionnaire_to_db- failed..")
            res.end('Failed');
          }
          else {
            console.log("push_qustionnaire_to_db - success....")
            res.end('Success');
          }
        });
      }
    }
  });
});

//-------------------------------------------------------------
app.post('/load_labs', function (req, res) {
  // Get sent data.
  var labs = req.body.labs//matrix
  console.log("labs: ", labs)
  for (var i = 0; i < labs.length; i++) {//running over every lab in array
    var sql = "insert into labs(LabCode, LabNum, DateTime, CourseCode, Semester) values(" + labs[i][0] + ", " + labs[i][1] + ", " + labs[i][2] + ", " + labs[i][3] + ", " + labs[i][4] + ");"
    console.log('query: ', sql)
    var query = db.query(sql, function (err, result) {
      // check result  
      if (err) {
        console.log('err: ', err)
        res.end(JSON.stringify(err))
      }
      else if (result === undefined) {//if something went wrong while inserting
        console.log("load_labs- failed..")
        res.end('Failed');
      }
      else {
        console.log("load_labs - success....")
        res.end('Success');

      }
    });
  }
});

//-------------------------------------------------------------
app.post('/load_schedulings', function (req, res) {
  // Get sent data.
  var schedulings = req.body.schedulings//matrix
  for (var i = 0; i < schedulings.length; i++) {//running over every schedule in matrix
    var sql = "insert into scheduling(scheduleCode, StudentCode, GuideCode, LabCode, LabName) values(" + schedulings[i][0] + ", " + schedulings[i][1].toString() + ", " + schedulings[i][2].toString() + ", " + schedulings[i][3] + ", '" + schedulings[i][4] + "');"
    console.log('query: ', sql)
    var query = db.query(sql, function (err, result) {
      // check result  
      if (err) {
        console.log('err: ', err)
        res.end(JSON.stringify(err))
      }
      else if (result === undefined) {//if something went wrong while inserting
        console.log("load_schedulings- failed..")
        res.end('Failed');
      }
      else {
        console.log("load_schedulings - success....")
        res.end('Success');

      }
    });
  }
});

//-------------------------------------------------------------
app.post('/return_course_data_per_user', function (req, res) {
  var course_name_arr = []
  var count_course // in order to send a response only after getting all queries results
  // Get sent data.
  var user = req.body
  if (user.type == 'students')
    var active_course_code = 'select distinct LabCode from scheduling where StudentCode = ' + user.password
  if (user.type == 'guides')
    var active_course_code = 'select distinct LabCode from scheduling where GuideCode = ' + user.password
  var course_id = []
  // Do a MySQL query.
  var query = db.query(active_course_code, function (err, result1) {
    // check result
    count_course = result1.length
    if (result1.length === 0) {//if student isnt signed up to any courses
      console.log("return active code course - failed..")
      res.end('Failed');
    }
    else {
      for (var i = 0; i < result1.length; i++) {
        var code_course = 'select distinct CourseCode, Semester from Labs where LabCode = ' + result1[i].LabCode;
        // Do a MySQL query.
        var query_course_code = db.query(code_course, function (err, result2) {
          if (result2.length === 0) {//if query failed
            console.log("return_code course - failed..")
            res.end('Failed');
          }
          else {
            course_id.push({ CourseCode: result2[0].CourseCode, Semester: result2[0].Semester })
            console.log('courses_id1111111: ', result2)
            var course_name = 'select CourseName from courses where Course_code = ' + result2[0].CourseCode + " and Semester = " + result2[0].Semester + ";"
            console.log(course_name)
            var query_course_code = db.query(course_name, function (err, result3) {
              if (result3.length === 0) {//if query failed
                console.log("return- course name - failed..")
                res.end('Failed');
              }
              else {
                course_name_arr.push(result3[0].CourseName)//adding course to aourses array
                count_course-- //counting how many results have returned
                if (count_course === 0) {// if all data was returned
                  // removing duplicates
                  var distinct_coursesNamesArr = []
                  var count_dup = 0 // how many items were deleted
                  for (var i = 0; i < course_name_arr.length; i++) {
                    if (!distinct_coursesNamesArr.includes(course_name_arr[i])) {
                      distinct_coursesNamesArr.push(course_name_arr[i])
                      course_id = course_id.splice(count_dup - i, 1)// removing course code from codes array accordingly
                      count_dup++
                    }
                  }
                  res.end(JSON.stringify({ courses_names: distinct_coursesNamesArr.toString(), courses_id: JSON.stringify(course_id) }))// returning string of studet's courses to client
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
app.post('/return_course_qustionnaire', function (req, res) {
  // Get sent data.
  var CourseCode = req.body.CourseCode

  var sql = "SELECT Question, QuestionNum from student_questions where Questionnaire_code = (SELECT Questionnaire_code from questionnaires where Course_code = " + CourseCode + ");"
  console.log('sql: ', sql)
  var query = db.query(sql, function (err, result) {
    // check result
    if (err) {
      console.log('err: ', err)
      res.end(err)
    }
    if (result.length == 0) {//if something went wrong while inserting
      console.log("return_course_qustionnaire- failed..")
      res.end('Failed');
    }
    else {
      console.log("return_course_qustionnaire - success....")
      console.log(result)
      res.end(JSON.stringify(result));

    }
  });
});

//-------------------------------------------------------------
app.post('/return_all_courses', function (req, res) {
  var sql = "SELECT * from courses group by CourseName;"
  var query = db.query(sql, function (err, result) {
    // check result  
    if (result === undefined) {//if something went wrong while fetching
      console.log("return_course_qustionnaire- failed..")
      res.end('Failed');
    }
    else {
      res.end(JSON.stringify(result));
    }
  });
});

//-------------------------------------------------------------
app.post('/return_all_guides', function (req, res) {
  console.log("options:",req.options);
  var sql = "SELECT FirstName, LastName, Password from guides;"
  var query = db.query(sql, function (err, result) {
    // check result  
    if (err)
      res.end(err)
    if (result === undefined) {//if something went wrong while fetching
      console.log("return_course_qustionnaire- failed..")
      res.end('Failed');
    }
    else {
      res.end(JSON.stringify(result));
    }
  });
});

//-------------------------------------------------------------

app.post('/push_filled_s_qustionnaire_to_db', function (req, res) {
  // Get sent data.
  if (true) {
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
      console.log("lab details: ", data)
      labNum = data.LabNum

      var success = 0
      //-------inserting comments----------------------
      var sql = "INSERT INTO student_questionnaire(Questionnaire_code, StudentCode, QuestionNum, AnswerNum, LabNum) values((SELECT Questionnaire_code from questionnaires where Course_code = (SELECT Course_code FROM Courses where CourseName = '" + CourseName + "')), '" + user_id + "', " + 0 + ", '" + comments + "', " + labNum + ");"
      console.log("sql: ", sql)
      var query = db.query(sql, function (err, result) {
        // check result  
        if (err) {
          res.end(JSON.stringify(err))
        }
        else if (result === undefined) {//if something went wrong while inserting
          console.log("push_comments_to_db- failed..")
          res.end('Failed');
        }
        else {
          console.log("push_comments_to_db - success....")
          success++
          if (success == Object.keys(answers).length + 1) {
            console.log('done!!!!!!!')
            res.end('Success');
          }
        }
      });
      //-------inserting answers----------------------
      for (i = 1; i <= Object.keys(answers).length; i++) {//running over every property in object
        console.log("student id: ", user_id)
        var sql = "INSERT INTO student_questionnaire(Questionnaire_code, StudentCode, QuestionNum, AnswerNum, LabNum) values((SELECT Questionnaire_code from questionnaires where Course_code = (SELECT Course_code FROM Courses where CourseName = '" + CourseName + "')), '" + user_id + "', " + i + ", " + answers[i] + ", " + labNum + ");"
        console.log("sql: ", sql)
        var query = db.query(sql, function (err, result) {
          // check result  
          if (result === err) {
            console.log('err: ', err)
          }
          if (result === undefined) {//if something went wrong while inserting
            console.log("push_filled_qustionnaire_to_db- failed..")
            res.end('Failed');
          }
          else {
            console.log("push_filled_qustionnaire_to_db - success....")
            success++
            if (success == Object.keys(answers).length + 1) {
              res.end('Success');
            }
          }
        });
      }
    }
  });

});

//-------------------------------------------------------------
app.post('/push_filled_g_qustionnaire_to_db', function (req, res) {
  console.log("hello push_filled_g_qustionnaire_to_db")
  // Get sent data.
  if (true) {
    var table = req.body.table//matrix
    var course = req.body.course
    console.log("table: ", table)
    var labNum
  }
  getLabDetails(course.CourseCode, course.Semester, function (data, err) {
    console.log("back from callback err: ", err, " ,data: ", data)
    // console.log("err: ", err, " ,data: ", data)
    if (err) {
      console.log(err);
    }
    else if (data === -1) {
      console.log("not time")
      res.end("not_time")
    }
    else {
      console.log("lab details: ", data)
      labNum = data.LabNum
      var sum = 0
      var q_code_res
      var q_code = "select Questionnaire_code from questionnaires where Course_code = " + course.CourseCode + ";"
      var query = db.query(q_code, function (err, q_res) {
        // check result  
        if (err) {
          console.log('err: ', err)
          res.end(JSON.stringify(err))
        }
        else {
          console.log("Questionnaire_code: ", q_res[0].Questionnaire_code)
          q_code_res = q_res[0].Questionnaire_code
          for (var i = 1; i < table.length; i++) { //running over every student in matrix
            var sum = 0
            for (var j = 2; j < table[0].length; j++) {  //running over every answer for student
              if (j == 10) {
                var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values(" + q_code_res + ", " + user_id + ", " + table[i][0] + ", " + 11 + ", " + sum + ", " + labNum + ");"
              }
              else {
                var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values(" + q_code_res + ", " + user_id + ", " + table[i][0] + ", " + (j + 1) + ", " + table[i][j] + ", " + labNum + ");"
                sum = (sum + parseInt(table[i][j]))
              }
              var query = db.query(sql, function (err, result) {
                // check result  
                if (err) {
                  console.log('err: ', err)
                  res.end(JSON.stringify(err))
                }
                else if (result === undefined) {//if something went wrong while inserting
                  console.log("load_students- failed..")
                  res.end('Failed');
                }
                else {
                  if (j == table[0].length) {
                    j++
                    var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values(" + q_code_res + ", " + user_id + ", " + table[i - 1][0] + ", " + 12 + ", " + table[i - 1][10] + ", " + labNum + ");"
                    var query = db.query(sql, function (err, result) {
                      // check result  
                      if (err) {
                        console.log('err: ', err)
                        res.end(JSON.stringify(err))
                      }
                      else if (result === undefined) {//if something went wrong while inserting
                        console.log("load_students- failed..")
                        res.end('Failed');
                      }
                      else {
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


//-------------------------------------------------------------
// returns student and guide details and questionnaire answers
function getStudentGuideDetails(student_code, guide_code, callback) {
  var guide_row = [], student_row = []
  //-------fetching student details--------------//
  var return_student_details = 'SELECT FirstName, LastName, Password FROM students WHERE Password = ' + student_code + ';'
  var query = db.query(return_student_details, function (err, res_s_d) {
    if (err)
      callback(err)
    else if (res_s_d.length === 0) {//if student doesn't exist in the system
      console.log("return_student_details - failed..")
      callback('Failed');
    }
    else {
      console.log("student details: ", res_s_d)
      student_row.push({ name: res_s_d[0].FirstName + ' ' + res_s_d[0].LastName, id: student_code })

      //-------fetching student answers--------------//
      var return_student_questionnaire = 'SELECT QuestionNum, AnswerNum FROM student_questionnaire WHERE Questionnaire_code = ' + res_q_code[0].Questionnaire_code + ' and StudentCode = "' + student_code + '" and LabNum = ' + user.lab_num + ';'
      var query = db.query(return_student_questionnaire, function (err, res_s_q) {
        console.log("q: ", return_student_questionnaire)
        console.log("res_s_q: ", res_s_q)
        if (err)
          callback(err)
        else if (res_s_q.length === 0) {//if student doesn't exist in the system
          console.log("return_student_questionnaire - failed..")
          callback('Failed');
        }
        else {
          console.log("student answers")
          student_row.push({ student: res_s_q })
          student_count++

          //-------fetching guide details--------------//
          var return_guide_details = 'SELECT FirstName, LastName, Password FROM guides WHERE Password = ' + guide_code + ';'
          var query = db.query(return_guide_details, function (err, res_g_d) {
            if (err)
              callback(err)
            else if (res_g_d.length === 0) {//if student doesn't exist in the system
              console.log("return_guide_details - failed..")
              callback('Failed');
            }
            else {
              console.log("guide details: ", res_g_d)
              guide_row.push({ name: res_g_d[0].FirstName + ' ' + res_g_d[0].LastName, id: guide_code })

              //-------fetching guide answers--------------//
              var return_guide_questionnaire = 'SELECT QuestionNum, AnswerNum FROM guide_questionnaire WHERE Questionnaire_code = ' + res_q_code[0].Questionnaire_code + ' and GuideCode = ' + guide_code + ' and StudentCode = ' + student_code + ' and LabNum = ' + user.lab_num + ';'
              var query = db.query(return_guide_questionnaire, function (err, res_g_q) {
                if (err)
                  callback(err)
                else if (res_g_q.length === 0) {//if student doesn't exist in the system
                  console.log("return_guide_questionnaire - MissingInformation..")
                  callback('MissingInformation');
                }
                else {
                  console.log("guide answers")
                  // guide_table.push({guide:res_g_q})
                  guide_count++
                  if (student_count === res_s_g.length && guide_count === res_s_g.length) {
                    console.log('guide_row: ', guide_row, '\n')
                    console.log('student_row: ', student_row)
                    callback({ guide_row: guide_row, student_row: student_row })
                  }
                }
              });
            }
          });
        }
      });
    }
  });
}

//-----------------------------------------------------
app.post('/return_course_follow_up', function (req, res) {
  var student_table = [], guide_table = [], return_message = null
  var user = req.body
  var return_questionnaire_code = 'SELECT Questionnaire_code FROM questionnaires WHERE Course_code = ' + user.course_code + ';'
  var query = db.query(return_questionnaire_code, function (err, res_q_code) {
    console.log("RESULT IS - return_questionnaire_code ", res_q_code, err);
    if (err)
      console.log('err', err)
    else if (res_q_code.length === 0) { //if failed to fetch questionnaire code
      console.log("return_questionnaire_code- failed..")
      res.end('Failed');
    }
    else { //-------------fetching lab code---------------------//
      var return_lab_code = 'SELECT LabCode FROM labs WHERE CourseCode = ' + user.course_code + ' and semester = ' + user.semester + ' and LabNum = ' + user.lab_num + ';'
      console.log('sql: ', return_lab_code)
      var query = db.query(return_lab_code, function (err, res_lab_code) {
        console.log("RESULT IS - return_active_course_code ", res_lab_code, err);
        if (err)
          console.log('err', err)
        else if (res_lab_code.length === 0) {//if failed to fetch active course code
          console.log(" return_active_course_code- failed..")
          res.end('Failed');
        }
        else {//--------fetching sudent and guide codes---------------------------------------------
          var lab_code = res_lab_code[0].LabCode
          var return_student_guide_pairs = 'SELECT distinct StudentCode, GuideCode FROM scheduling WHERE LabCode = ' + lab_code + ';'
          console.log("QUERY: ", return_student_guide_pairs)
          // Do a MySQL query.
          var query = db.query(return_student_guide_pairs, function (err, res_s_g) {
            console.log("result-return_student_guide_pairs: ", res_s_g)
            if (err)
              console.log('err', err)
            else if (res_s_g.length === 0) {
              console.log(" - failed..")
              res.end('Failed');
            }
            else {
              var i_object = {}
              var i = 0, student_count = 0, guide_count = 0
              for (i; i < res_s_g.length; i++) {
                j = i
                //-------fetching student details--------------//
                var return_student_details = 'SELECT FirstName, LastName, Password FROM students WHERE Password = ' + res_s_g[i].StudentCode + ';'
                console.log('query: ', return_student_details)
                var query = db.query(return_student_details, function (err, res_s_d) {
                  console.log("result-return_student_details: ", res_s_d)
                  if (err)
                    console.log('err', err)
                  else if (res_s_d.length === 0) {//if student doesn't exist in the system
                    console.log("return_student_details - failed..")
                    res.end('Failed');
                  }
                  else {
                    student_table.push({ name: res_s_d[0].FirstName + ' ' + res_s_d[0].LastName, id: res_s_d[0].Password })
                    console.log('came back from fetching student d')
                  }
                });
                //-------fetching student answers--------------//
                var student_id = res_s_g[i].StudentCode
                var return_student_questionnaire = 'SELECT QuestionNum, AnswerNum FROM student_questionnaire WHERE Questionnaire_code = ' + res_q_code[0].Questionnaire_code + ' and StudentCode = ' + res_s_g[i].StudentCode + ' and LabNum = ' + user.lab_num + ';'
                var query = db.query(return_student_questionnaire, function (err, res_s_q) {
                  console.log("result-return_student_questionnaire: ", res_s_q)
                  if (err)
                    console.log('err', err)
                  else if (res_s_q.length === 0) {//if student doesn't exist in the system
                    console.log("return_student_questionnaire - missing student q ", return_message)
                    return_message = { message: "missing student q", details: student_id }
                    student_count++
                    // res.end('Failed');
                  }
                  else {
                    student_table.push({ student: res_s_q })
                    student_count++
                    console.log('came back from fetching student q')
                  }
                });
                //-------fetching guide details--------------//
                var return_guide_details = 'SELECT FirstName, LastName, Password FROM guides WHERE Password = ' + res_s_g[i].GuideCode + ';'
                console.log('query: ', return_guide_details)
                var query = db.query(return_guide_details, function (err, res_g_d) {
                  console.log("result-return_guide_details: ", res_g_d)
                  if (err)
                    console.log('err', err)
                  else if (res_g_d.length === 0) {//if student doesn't exist in the system
                    console.log("return_guide_details - failed..")
                    res.end('Failed');
                  }
                  else {
                    guide_table.push({ name: res_g_d[0].FirstName + ' ' + res_g_d[0].LastName, id: res_g_d[0].Password })
                    console.log('came back from fetching guide d')
                  }
                });
                //-------fetching guide answers--------------//
                var return_guide_questionnaire = 'SELECT QuestionNum, AnswerNum FROM guide_questionnaire WHERE Questionnaire_code = ' + res_q_code[0].Questionnaire_code + ' and GuideCode = ' + res_s_g[i].GuideCode + ' and StudentCode = ' + res_s_g[i].StudentCode + ' and LabNum = ' + user.lab_num + ';'
                var query = db.query(return_guide_questionnaire, function (err, res_g_q) {
                  console.log("result-return_guide_questionnaire: ", res_g_q)
                  if (err)
                    console.log('err', err)
                  else if (res_g_q.length === 0) {//if student doesn't exist in the system
                    console.log("return_guide_questionnaire - missing guide details")
                    return_message = { message: "missing guide q", details: res_g_g[i].GuideCode }
                    // res.end('Failed');
                  }
                  else {
                    console.log('came back from fetching guide q')
                    guide_table.push({ guide: res_g_q })
                    guide_count++
                    if (student_count === res_s_g.length && guide_count === res_s_g.length) {
                      console.log('guide_table: ', guide_table, '\n\n')
                      console.log('student_table: ', student_table)
                      res.send({ guide_table: guide_table, student_table: student_table, return_message: return_message })
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
app.post('/fetch_answer_ranges_per_g_q', function (req, res) {
  course_code = req.body.CourseCode
  var sql = "SELECT AnswerRange from guide_questions where Questionnaire_code = (select Questionnaire_code from questionnaires where Course_code = " + course_code + ");"
  var query = db.query(sql, function (err, result) {
    // check result  
    if (result === undefined) {//if something went wrong while fetching
      console.log("fetch_answer_ranges_per_g_q- failed..")
      res.end('Failed');
    }
    else {
      res.end(JSON.stringify(result));
    }
  });
});

//-------------------------------------------------------------
app.post('/return_guide_questionnaire', function (req, res) {
  // Get sent data.
  console.log("student id: ", user_id)
  var CourseCode = req.body.CourseCode

  var sql = "select QuestionNum, Question, AnswerRange from guide_questions where Questionnaire_code = (select Questionnaire_code from questionnaires where Course_code = " + CourseCode + ");"
  console.log("sql: ", sql)
  var query = db.query(sql, function (err, result) {
    // check result  
    if (result === undefined) {//if something went wrong while inserting
      console.log("return_all_students_per_guide- failed..")
      res.end('Failed');
    }
    else {
      console.log("return_all_students_per_guide - success....")
      console.log('result: ', result)
      res.end(JSON.stringify(result));
    }
  });
});

//-----------------------------------------------------
app.post('/returns_students_per_guide_and_lab', function (req, res) {
  // Get sent data.
  if (true) {
  }
  var course = req.body.course
  console.log("course: ", course)
  getLabDetails(course.CourseCode, course.Semester, function (data, err) {
    if (err) {
      console.log(err);
    }
    else if (data === -1)
      res.end("not_time")
    else {
      var return_student_codes = 'SELECT StudentCode, LabName from scheduling where GuideCode = "' + user_id + '" and LabCode = ' + data.LabCode + ';'
      // Do a MySQL query.
      var query = db.query(return_student_codes, function (err, res_students) {
        // check result
        if (err) {
          console.log('err: ', err)
          res.end(JSON.stringify(err))
        }
        else if (res_students.length === 0) {//if student doesn't exist in the system
          console.log("return_students - failed..")
          res.end('check_data');
        }
        else {
          var LabName = res_students[0].LabName
          var count = res_students.length
          var studentsArr = []
          console.log("return_students: ", res_students[0])
          for (var i = 0; i < res_students.length; i++) {
            var studentPwd = res_students[i].StudentCode
            console.log('studentPwd: ', studentPwd)
            var return_student_name = 'SELECT FirstName, LastName FROM students where Password = ' + studentPwd + ';'
            console.log('sql: ', return_student_name)
            var j = 0
            var query = db.query(return_student_name, function (err, res_student_name) {
              // check result
              if (res_student_name.length === 0) {//if student doesn't exist in the system
                console.log("res_student_name - failed..")
                res.end('Failed');
              }
              else {
                console.log('res_student_name ', i, res_student_name, "return_students: ", j, res_students[j])
                studentsArr.push({ FirstName: res_student_name[0].FirstName, LastName: res_student_name[0].LastName, Password: res_students[j].StudentCode })
                count--
                if (count === 0)
                  res.end(JSON.stringify([studentsArr, LabName]))
                j++
              }
            });
          }
          // res.send(result[0]);//result comes as an array
        }
      });
    }
  });
});