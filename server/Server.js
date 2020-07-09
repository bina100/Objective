const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const accessTokenManeger = require('./AccessToken')
const path = require('path');
const { responsiveFontSizes } = require('@material-ui/core');
// const findToken=accessTokenManeger.getTokenFromReq;
///maybe- check loopback?
app.use(express.static(__dirname + '/build'));
app.set('views', path.join(__dirname, '/build'));

let valid = true
let status = true

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
app.use ('/',async function(req,res,next){
  if(status == 'login')
    res.redirect('/Login')
  else{
    try{
      let verifying_response = await app.tokenManager.getTokenFromReq(req,res,next);
      console.log("res_getTokenFromReq: ", verifying_response)
      if (verifying_response.err){
        console.log("get token err: ", verifying_response.err)
        valid = false;
        status = 'login'
        //res.redirect('/Login')
        
      }
      //token out of time
      if(!verifying_response.success){
        if(verifying_response.error == 'OOT'){
          //deleteToken(verifying_response.user)
          try{
            let deleteToken_response = await app.tokenManager.deleteOldUserToken(verifying_response.user)
            console.log("token deleted successfully")
            valid = false;
            status = 'login'
            //res.redirect('/')
            
          }catch(err){
            console.log("err deleting token: ", err)
          }
        }
        else if(verifying_response.error == 'not_found'){
          console.log("err from verifying response: ", verifying_response.error)
          status = 'login'
          valid = false;
          //res.redirect('/Login')
          
        }
      }
      status = ''
      return next()
    }
    catch{
      console.log("res_getTokenFromReq failed")
      //res.end('Failed')
    }
  }
});

db.connect((err) => {
  if (err) {
    console.log("my sql1 " + err);
  }
  else
  console.log('mysql connected...');
});

var user_id = ''


async function deleteToken(res, user){
  try{
    let deleteToken_response = await app.tokenManager.deleteOldUserToken(user)
    console.log("token deleted successfully")
    // valid = false;
    // status = "login"

  }catch(err){
    console.log("err deleting token: ", err)
  }
  return res.end()
}

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

function formatDate(date) {
  var dd = String(date.getDate()).padStart(2, '0');
  var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = date.getFullYear();
  var h = date.getHours();
  var m = date.getMinutes();
  var s = date.getSeconds();

  let new_date = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + m + ':' + s
  return (new_date)
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

//-----------------------------------------------------
app.post('/delete_token', function (req, res) {
  console.log("delete_token for: ", req.body.username)
  deleteToken(res, req.body.username)
});

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
      return res.end('Failed');
    }
    else {
      user_id = result[0].password
      //create accessToken 
      try {
        let token = await AccessTokenManeger.createToken(user.username, user.type);
        console.log("token:", token);
        valid = true;
        status = false
        //TODO- set for 1 hour.
        res.cookie('access_token', token.token,{});
        return res.end('Success');
      } catch (er) { 
        console.error(er);
        res.end("Failed");
      }
    }
  });
});

//-----------------------------------------------------
app.post('/return_user_name', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
  else{
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
 }
});

//----------------------delete user-------------------------------
app.post('/delete_user', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
  // Get sent data.
  var user_type = req.body.user_type
  var id = req.body.id
  if(user_type == "students"){
    var sql_s = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";' //student not in courses
    console.log("q ",sql_s)
    // Do a MySQL query.
    var query_s = db.query(sql_s, function (err_s, result_s) {
      // check result
      if (err_s) {
        console.log('student exist end in courses')
        var student_q = 'delete from student_questionnaire where StudentCode = "' + id + '";'
        console.log("qs ",student_q)
       // Do a MySQL query.
       var query = db.query(student_q, function (err, result) {
         // check result
         if (err) {//if student doesn't exist in the system
           res.end('Failed');
          }
         else{
           var guide_q ='delete from guide_questionnaire where StudentCode = "' + id + '";'
           console.log("qg ",guide_q)
           // Do a MySQL query.
           var query = db.query(guide_q, function (err, result) {
             // check result
             if (err) {//if student doesn't exist in the system
               res.end('Failed');
             }
             else if (result.affectedRows == 0)
               res.end('Failed not exist')
             else{
               var schedul_q = 'delete from scheduling where StudentCode = "' + id + '";'
               console.log("qc ",schedul_q)
               // Do a MySQL query.
               var query = db.query(schedul_q, function (err, result) {
                   // check result
                 if (err) {//if student doesn't exist in the system
                   res.end('Failed');
                 }
                 else if (result.affectedRows == 0)
                   res.end('Failed not exist')
                 else{
                   // Do a MySQL query.
                   var sql = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";'
                   console.log("q ",sql)
                   // Do a MySQL query.
                   var query = db.query(sql, function (err, result) {
                     // check result
                     if (err) {//if student doesn't exist in the system
                       res.end('Failed');
                     }
                     else if (result.affectedRows == 0)
                       res.end('Failed not exist')
                     else{
                       console.log('student deleted')
                       return res.end('student')
                     }
                   });
                 }
               });
             }
           });
         }
       });

    }
    else if (result_s.affectedRows == 0){
      console.log('student does not exist ')
      return res.end('Failed not exist')

    }
    else{
      console.log('Student deleted')
      return res.end('student')
    }
  });
  }
  else if(user_type === "guides"){
    //  // Do a MySQL query.
      var sql1 = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";' //guide not in courses
      console.log("q ",sql1)
      var query = db.query(sql1, function (err_g, result_g) {
        // check result
        if (err_g) {
          console.log('guide exist end in courses')
          var guide_q = 'delete from guide_questionnaire where GuideCode = "' + id + '";'
          console.log("qg ",guide_q)
          // Do a MySQL query.
          var query = db.query(guide_q, function (err, result) {
            // check result
            if (err) {//if guide doesn't exist in the system
              console.log("delete user 3 - failed..")
              res.end('Failed');
            }
            else if (result.affectedRows == 0){
              console.log('guide does not exist ')
              return res.end('Failed not exist')
            }
           
            else{
              var guide_sch ='delete from scheduling where GuideCode = "' + id + '";'
              console.log("qg ",guide_sch)
              // Do a MySQL query.
              var query = db.query(guide_sch, function (err, result) {
                // check result
                if (err) {//if guide doesn't exist in the system
                  console.log("delete user 4- failed..")
                  res.end('Failed');
                }
                else if (result.affectedRows == 0){
                  console.log('guide does not exist ')
                  return res.end('Failed not exist')
                }
               
                else{
                  var guide_p = 'delete from guides where Password = "' + id + '";'
                  console.log("qc ",guide_p)
                  // Do a MySQL query.
                  var query = db.query(guide_p, function (err, result) {
                    // check result
                    if (err) {//if student doesn't exist in the system
                      console.log("delete user 5- failed..")
                      res.end('Failed');
                    }
                    else if (result.affectedRows == 0){
                      console.log('guide does not exist ')
                      return res.end('Failed not exist')
                    }
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
                        {
                          console.log('guide does not exist ')
                          return res.end('Failed not exist')
                        }
                        else{
                          console.log("deleted guide")
                          res.end('guide')
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
        else if (result_g.affectedRows == 0){
          console.log('guide does not exist ')
          return res.end('Failed not exist')
        }
        else{
          console.log("delete guide")
          res.end('guide')
        }
      });
  }
  else{
    console.log(user_type)
    var sql3 = 'DELETE FROM director WHERE password = "' + id + '";'
    console.log("q ",sql3)
    // Do a MySQL query.
    var query = db.query(sql3, function (err_dq, result_dq) {
      // check result
      if (err_dq) {
        var director_c = 'delete from courses where DirectorCode = "' + id + '";'
        console.log("qg ",director_c)
        // Do a MySQL query.
        var query = db.query(director_c, function (err_d, result_d) {
          // check result
          if (err_d) {//if director doesn't exist in the system
            var director_p ='delete from director where Password = "' + id + '";'
            console.log("qg ",director_p)
            // Do a MySQL query.
            var query = db.query(director_p, function (err, result) {
              // check result
              if (err) {//if director doesn't exist in the system
                console.log("delete user - failed..")
                res.end('Failed');
              
          }
            else if (result_d.affectedRows == 0){
              console.log('director does not exist ')
              return res.end('Failed not exist')
            }
            else{
              consol.log("deleted director")
              res.end('director')
            }
          });
          }
          else if (result.affectedRows == 0){
            console.log('director does not exist ')
            return res.end('Failed not exist')
          }
          else{
            console.log("delete user - failed..")
            res.end('Failed');
          }
        });
      }
      else if (result_dq.affectedRows == 0){
        console.log('director does not exist ')
        return res.end('Failed not exist')
      }
      else{
        console.log("deleted director")
        res.end('director')
      }
    });

    
  }
});

//----------------------delete questionnaire-------------------------------
app.post('/delete_questionnaire', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
  // Get sent data.
  var data = req.body
  var sql = "select Questionnaire_code from questionnaires where Course_code = "+data.CourseCode+";"
  var query = db.query(sql, function (err, result) {
    // check result  
    if (err) {
      console.log('err: ', err)
      return res.end(JSON.stringify(err))
    }
    else if (result === undefined) {
      console.log("load_labs- failed..")
      return res.end('Failed');
    }
    else {
      console.log("type: ", data.type)
      var sql1 = "delete from "+data.type+" where Questionnaire_code = "+result[0].Questionnaire_code+";"
      var query = db.query(sql1, function (err, result) {
        // check result  
        if (err) {
          console.log('err: ', err)
          return res.end(JSON.stringify(err))
        }
        else if (result === undefined) {
          return res.end('Failed');
        }
        else {
          return res.end("success")
        }
      });
    }
  });
});

//----------------------delete schedule-------------------------------
app.post('/delete_schedule', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
  // Get sent data.
  var data = req.body
  console.log("datetime: ", data.datetime)
  console.log("dataetime: ", new Date( data.datetime))
  var sql = "select LabCode from labs where CourseCode = "+data.CourseCode+" and DateTime = '"+formatDate(new Date(data.datetime))+"';"
  console.log("sql: ", sql )
  var query = db.query(sql, function (err, result) {
    // check result  
    if (err) {
      console.log('err: ', err)
      return res.end('Failed')
    }
    else if (result === undefined || result.length == 0) {
      console.log("delete_schedule- failed..")
      return res.end('Failed');
    }
    else {
      console.log("labCode: ", result)
      var sql1 = "delete from scheduling where StudentCode = "+data.studentCode+" and GuideCode = "+data.guideCode+" and LabCode = "+result[0].LabCode+";"
      var query = db.query(sql1, function (err, result) {
        // check result  
        if (err) {
          console.log('err: ', err)
          return res.end('Failed')
        }
        else if (result === undefined) {
          return res.end('Failed');
        }
        else {
          return res.end("success")
        }
      });
    }
  });
});

//----------------------delete schedule-------------------------------
app.post('/delete_lab', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
  // Get sent data.
  var data = req.body
  var labCode = 0
  console.log("dataetime: ", new Date( data.datetime))
  var sql = "select LabCode from labs where CourseCode = "+data.CourseCode+" and DateTime = '"+formatDate(new Date(data.datetime))+"';"
  console.log("sql: ", sql )
  var query = db.query(sql, function (err, result) {
    // check result  
    if (err) {
      console.log('err: ', err)
      return res.end('Failed')
    }
    else if (result === undefined || result.length == 0) {
      console.log("delete_schedule- failed..")
      return res.end('Failed');
    }
    else {
      console.log("labCode: ", result)
      labCode = result[0].LabCode
      var sql1 = "delete from scheduling where LabCode = "+result[0].LabCode+";"
      var query = db.query(sql1, function (err, result1) {
        // check result  
        if (err) {
          console.log('err: ', err)
          return res.end('Failed')
        }
        else if (result1 === undefined) {
          return res.end('Failed');
        }
        else {
          var sql2 = "delete from labs where LabCode = "+labCode+";"
          var query = db.query(sql2, function (err, result2) {
            // check result  
            if (err) {
              console.log('err: ', err)
              return res.end('Failed')
            }
            else if (result2 === undefined) {
              return res.end('Failed');
            }
            else {
              return res.end("success")
            }
          });
        }
      });
    }
  });
});

//-------------------------------------------------------------
app.post('/load_students', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
app.post('/load_admin', function (req, res) {
  // Get sent data.
  var admin = req.body.admin//two dimention array
  var password =  req.body.password
  console.log("admin: ", admin)
  console.log("password: ", password)

  // for (var i = 0; i < admin.length; i++) {//running over every guide in matrix
    var sql = "INSERT INTO admin(FirstName, LastName, Username, Password) values('" + admin[0][0] + "','" + admin[0][1] + "', '" + admin[0][2] + "', '" + admin[0][3] + "');"
    console.log('query: ', sql)
    var query = db.query(sql, function (err, result) {
      // check result  
      if (err) {
        console.log('err: ', err)
        res.end(JSON.stringify(err))
      }
      else if (result === undefined) {//if something went wrong while inserting
        console.log("load_admin- failed..")
        res.end('Failed');
      }
      else {
        console.log("load_admin - success....")
        res.end('Success');

      }


    // delete from admin where Password = 96385274;‏


  
        var delete_admin ='delete from admin where Password = "' + password + '";'
        console.log("delete admin passore ",delete_admin)
        // Do a MySQL query.
        var query = db.query(delete_admin, function (err, result) {
          // check result
          if (err) {//if admin doesn't exist in the system
            console.log("delete user - failed..")
            res.end('Failed');
          }
          else if (result.affectedRows == 0)
            res.end('Failed')
          else{
            console.log("deleted old admin")
            return res.end('admin')
            // // Do a MySQL query.
            // var sql = 'DELETE FROM ' + user_type + ' WHERE password = "' + id + '";'
            // console.log("q ",sql)
            // // Do a MySQL query.
            // var query = db.query(sql, function (err, result) {
            //   // check result
            //   if (err) {//if student doesn't exist in the system
            //     console.log("delete user - failed..")
            //     res.end('Failed');
            //   }
            //   else if (result.affectedRows == 0)
            //     res.end('Failed')
              
            // });
          }
        });
      


    });
  
});

//-------------------------------------------------------------
app.post('/push_student_qustionnaire_to_db', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
  else{
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
  }
});

//-------------------------------------------------------------
app.post('/return_all_courses', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
    console.log("push_filled_g_qustionnaire_to_db- OOT")
  }
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
          for (var i = 1; i < table.length;i++) { //running over every student in matrix
            // var sum = 0
            for (var j = 2; j < table[0].length; j++) {  //running over every answer for student
              var sql = "insert into guide_questionnaire(Questionnaire_code, GuideCode, StudentCode, QuestionNum, AnswerNum, LabNum) values(" + q_code_res + ", " + user_id + ", " + table[i][0] + ", " + (j + 1) + ", " + table[i][j] + ", " + labNum + ");"
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
                  console.log('done- j=',j, 'i=',i)
                  if (j == table[0].length) {
                    console.log("push_guide_qustionnaire_to_db - success....")
                    j++
                    res.end('Success');
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
function getGuideAnswers(id, stdent_id, Questionnaire_code, labNum, callback){
  console.log("g_id: ",id,  " stdent_id: ", stdent_id, " Questionnaire_code: ", Questionnaire_code, " labNum: ", labNum)
  var guide_details_answers = []
  //-------fetching guide details--------------//
  var return_guide_details = 'SELECT FirstName, LastName, Password FROM guides WHERE Password = ' + id + ';'
  var query = db.query(return_guide_details, function (err, res_g_d) {
    if (err)
      callback({'err':err})//query err
    else if (res_g_d.length === 0) {//if student doesn't exist in the system
      console.log("return_guide_details - failed..")
      callback({'err':1});// guide doesn't exist
    }
    else {
      guide_details_answers.push({ name: res_g_d[0].FirstName + ' ' + res_g_d[0].LastName, id: res_g_d[0].Password })
      //-------fetching guide answers--------------//
      var return_guide_questionnaire = 'SELECT QuestionNum, AnswerNum FROM guide_questionnaire WHERE Questionnaire_code = ' + Questionnaire_code + ' and GuideCode = ' + id + ' and StudentCode = ' + stdent_id + ' and LabNum = ' + labNum + ';'
      var query = db.query(return_guide_questionnaire, function (err, res_g_q) {
        if (err)
          callback({'err':err})// query err
        else {
          if (res_g_q.length === 0) {//if there isn't a guide questionnaire filled in
            console.log("return_guide_questionnaire - missing guide details")
            return_message2 = { message: "missing guide q", code:id}
            guide_details_answers.push({guide:[{QuestionNum:3,AnswerNum:0},
                                      {QuestionNum:4,AnswerNum:0},
                                      {QuestionNum:5,AnswerNum:0},
                                      {QuestionNum:6,AnswerNum:0},
                                      {QuestionNum:7,AnswerNum:0},
                                      {QuestionNum:8,AnswerNum:0},
                                      {QuestionNum:9,AnswerNum:0},
                                      {QuestionNum:10,AnswerNum:0},
                                      {QuestionNum:11,AnswerNum:0}  ]})
          }
          else
            guide_details_answers.push({ guide: res_g_q })
          callback(guide_details_answers)
        }
      });
    } 
  });
}
//-----------------------------------------------------
function getStudentAnswers(id, Questionnaire_code, labNum, callback){
  var student_details_answers = []
  //-------fetching student details--------------//
  var return_student_details = 'SELECT FirstName, LastName, Password FROM students WHERE Password = ' + id + ';'
  var query = db.query(return_student_details, function (err, res_s_d) {
    if (err)
      callback({'err':err})//query err
    else if (res_s_d.length === 0) {//if student doesn't exist in the system
      console.log("return_student_details - failed..")
      callback({'err':1})//student doesn't exist
    }
    else { 
      student_details_answers.push({ name: res_s_d[0].FirstName + ' ' + res_s_d[0].LastName, id: res_s_d[0].Password })
      //-------fetching student answers--------------//
      var return_student_questionnaire = 'SELECT QuestionNum, AnswerNum FROM student_questionnaire WHERE Questionnaire_code = ' + Questionnaire_code + ' and StudentCode = ' + id + ' and LabNum = ' + labNum + ';'
      var query = db.query(return_student_questionnaire, function (err, res_s_q) {
        if (err)
          callback({'err':err})
        else {
          if (res_s_q.length === 0) {//if student didn't fill in questionnaire
            return_message1 = { message: "missing student q", code: id }
            student_details_answers.push({student:[{QuestionNum:0,AnswerNum:0},
                                        {QuestionNum:1,AnswerNum:0},
                                        {QuestionNum:2,AnswerNum:0},
                                        {QuestionNum:3,AnswerNum:0},
                                        {QuestionNum:4,AnswerNum:0},
                                        {QuestionNum:5,AnswerNum:0},
                                        {QuestionNum:6,AnswerNum:0},
                                        {QuestionNum:7,AnswerNum:0},
                                        {QuestionNum:8,AnswerNum:0},
                                        {QuestionNum:9,AnswerNum:0}  ]})
          }
          else
            student_details_answers.push({ student: res_s_q })
          callback(student_details_answers)
        }
      });
    }
  });
}
//-----------------------------------------------------
function get_student_guide_answers(guide_code, student_code, Questionnaire_code, labNum, callback){
  var guide = false, student = false, g_data, s_data
  getGuideAnswers(guide_code, student_code, Questionnaire_code, labNum, function (data, err) {
    if(err){
      res.end('Failed')
    }
    if (data.err) {
      if (data.err == 1){
        console.log("return_guide_details - failed..")
        res.end('Failed');
      }
      else
        console.log(err);
    }
    else {
      g_data = data
      guide = true
      if(guide && student)
        callback({guide:g_data, student:s_data})
    }
  });
  getStudentAnswers(student_code, Questionnaire_code, labNum, function (data, err) {
    if(err){
      res.end('Failed')
    }
    if (data.err) {
      if (data.err == 1){
        console.log("return_student_details - failed..")
        res.end('Failed');
      }
      else
        console.log(err);
    }
    else {
      student = true
      s_data = data
      if(guide && student){
        callback({guide:g_data, student:s_data})
        console.log("return from student")
      }
    }
  });
}

//-----------------------------------------------------
app.post('/return_course_follow_up', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
  var student_table = [], guide_table = [], return_message1 = undefined, return_message2 = undefined
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
      var query = db.query(return_lab_code, function (err, res_lab_code) {
        if (err)
          console.log('err', err)
        else if (res_lab_code.length === 0) {//if failed to fetch active course code
          console.log(" return_active_course_code- failed..")
          res.end('Failed');
        }
        else {//--------fetching sudent and guide codes---------------------------------------------
          var lab_code = res_lab_code[0].LabCode
          var return_student_guide_pairs = 'SELECT distinct StudentCode, GuideCode FROM scheduling WHERE LabCode = ' + lab_code + ';'
          var sent = false
          // Do a MySQL query.
          var query = db.query(return_student_guide_pairs, function (err, res_s_g) {
            console.log("result-return_student_guide_pairs: ", res_s_g)
            res_s_g_table = res_s_g
            if (err)
              console.log('err', err)
            else if (res_s_g.length === 0) {
              console.log(" - failed..")
              res.end('Failed');
            }
            else {
              count = 0
              res_s_g.forEach(function(curr_student_guide, i) {
                get_student_guide_answers(curr_student_guide.GuideCode, curr_student_guide.StudentCode, res_q_code[0].Questionnaire_code, user.lab_num, function(data, err){
                  if(err){
                    console.log(" - failed..")
                    res.end('Failed')
                  }
                  else{
                    count++
                    data.guide.forEach(function(element, i){
                      guide_table.push(element)
                    });
                    data.student.forEach(function(element, i){
                      student_table.push(element)
                    });
                    if(count === res_s_g.length)
                      res.send({ guide_table: guide_table, student_table: student_table, message1: return_message1, message2: return_message2 })
                  }
                });
              });//for
            }
          });//res_s_g
        }
      });//res_ac_code
    }
  });//res_q_code   
});//post

//-------------------------------------------------------------
app.post('/fetch_answer_ranges_per_g_q', function (req, res) {
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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
  if(!valid){
    return res.end('OOT')
  }
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


