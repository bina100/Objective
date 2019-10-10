const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();

//app.use(bodyParser.urlencoded({extended: false}))

//app.use(express.static('./src/Login.js'))

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'bina1234',
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
    var query = db.query('INSERT INTO student SET ?', {password: user.password, username: user.username}, function(err, result) {
      // Neat!
    });
    console.log("hello ..."+ query);
    res.end('Success');
  });
  

app.listen('5000', ()=>{
    console.log('app running on port 5000')
})