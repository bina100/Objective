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

// app.post('/check_user_existence', (req, res)=>{
//     console.log("trying to check user existance")
//     res.end()
// })

app.post('/studentExist', function(req, res) {
    console.log("hello server...");
    // Get sent data.
    var user = req.body;
    // Do a MySQL query.
    var query = db.query(`SELECT username, password FROM students WHERE username = '${user.username}' and password = '${user.password}'`, function(err, result) {
      // check result
      console.log("RESULT IS ",result,err);
      res.end('Success');
    });
    console.log("hello ..."+ query);
  });
  

app.listen('5000', ()=>{
    console.log('app running on port 5000')
})