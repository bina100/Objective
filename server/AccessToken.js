'use strict';
const randomstring = require('randomstring');
module.exports = class AccessToken {
    constructor(dbconnection) {
        this.connection = dbconnection;
    }
    createToken(username, role) {
        //TODO - delete old user tokens 
        // if token exists in db - try to generate different token. 
        let token = randomstring.generate(50);
        role = role.toUpperCase();
        let date = formatDate(new Date(Date.now() + (60 * 60 * 1000)));
        var query = 'insert into access_token(id, username, valid_until, role) values("' + token + '", "' + username + '", "' + date + '", "' + role + '");'
        console.log("query:", query);
        return new Promise((resolve, reject) => {
            this.connection.query(query, function (err, result) {
                // check result
                if (err) {
                    return reject({ success: false, error: err })
                }
                else {
                    return resolve({ success: true, token: token });
                }
            });
        })
    }

    deleteOldUserToken(username) {
        // console.log("delete old user!!!")
        var query = 'delete from access_token where username = "'+username+'";'
        return new Promise((resolve, reject) => {
            this.connection.query(query, function (err, result) {
                // check result
                console.log("delete token result: ", result)
                if (err) {
                    return reject({ success: false, error: err })
                }
                else {
                    console.log("deleteOldUserToken succeeded")
                    return resolve({ success: true});
                }
            });
        })
    }

    verifyToken(token, callback) {
        console.log("verify token!!!")
        //TODO - if access token is expired- delete it from the req(cookie) and from db.
        //find in db
        var query = 'select * from access_token where id = "' + token + '";'
        console.log("query:", query);
        this.connection.query(query, function (err, result) {
            // check result
            console.log("verify token res: ", result)
            if (err) {
                callback({ success: false, error: err })
            }
            else if (result.length === 0) {
                callback({ success: false, error: "not_found" })
            }
            else {
                let current_date = new Date()
                console.log("curr date: ", formatDate(current_date), "valid until: ", formatDate(result[0].valid_until), current_date > result[0].valid_until)
                if (current_date > result[0].valid_until) {
                    // date out of bound
                    // deleteOldUserToken(result[0].username)
                    callback({ success: false, error: "out_of_time" ,user:result[0].username})
                    // this.deleteOldUserToken(result[0].username, function(data, err){
                    //     if(err){
                    //         console.log(err);
                    //         console.log("err deleting token")
                    //         //return res.end(JSON.stringify({err:'Failed'}))
                    //         callback({success:false, error: 'Failed'})
                    //         //TODO: deal with this
                    //     }
                    //     else{
                    //         if(data.success = true){
                    //             console.log("token deleted: ", data)
                    //             callback({success:false, error: 'OOT'})
                    //             //return res.end('OOT')
                    //         }
                    //         else{
                    //             console.log("problem deleting token: ", data)
                    //             callback({success:false, error: 'Failed'})
                    //             //return res.end(JSON.stringify({err:'Failed'}))
                    //             //TODO: deal with this
                    //         }
                    //     }
                    // })
                }
                else {
                    console.log("verification succeeded: user: ",result[0].username)
                    callback({ success:true, user: result[0].username, role: result[0].role })
                }
            }
        })
        //2 - check date
    }
    getTokenFromReq(req, res, next) {
        console.log("get token from req!!!")
        if ('/userExist' === req.path)
            return next();
        return new Promise((resolve, reject) => {
            let token = req.query.access_token || get_cookies(req)['access_token'];
            console.log('token', token);
            // let token=req.query.AccessToken || req.headers.cookie;
            if (token) {
                console.log("before verifying token")
                this.verifyToken(token, function (data, err) {
                    console.log("res: ", data)
                    if (err) {
                      console.log(err);
                    }
                    else {
                        if(data.success == true){
                            req.options = { access_token: token };
                            return resolve({success:true, user:data.user})
                        }
                        if(data.success==false) {
                            console.log("error on verify token:", data.error);
                            if(data.error == "out_of_time"){
                                console.log("OOT")
                                return resolve({success:false, error:'OOT', user:data.user})
                                // this.deleteOldUserToken(data.user, function(data1, err1){
                                //     if(err1){
                                //         console.log(err1);
                                //         console.log("err deleting token")
                                //         //return res.end(JSON.stringify({err:'Failed'}))
                                //         return reject({success:false, error: 'Failed'})
                                //         //TODO: deal with this
                                //     }
                                //     else{
                                //         if(data1.success = true){
                                //             console.log("token deleted: ", data1)
                                //             return reject({success:false, error: 'OOT'})
                                //             //return res.end('OOT')
                                //         }
                                //         else{
                                //             console.log("problem deleting token: ", data1)
                                //             return reject({success:false, error: 'Failed'})
                                //             //return res.end(JSON.stringify({err:'Failed'}))
                                //             //TODO: deal with this
                                //         }
                                //     }
                                // })
                            }
                            else if(data.error == 'not_found'){
                                console.log("!!!! not found")
                                return resolve({success:false, error:'not_found'})
                            }
                            else{
                                console.log("!!!!!!else")
                                return res.end(JSON.stringify(data.error))
                            }
                        }
                    }
                // let res = this.verifyToken(token);
                // console.log("res: ", res)
                })
                
            }
            else {
                console.log("req", req)
                return res.end("Failed")
            }
        })
    }
}

// module.exports.


function formatDate(date) {
    console.log("now is: ", date)
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();

    let new_date = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + m + ':' + s
    return (new_date)
}


var get_cookies = function (request) {
    var cookies = {};
    request.headers && request.headers.cookie.split(';').forEach(function (cookie) {
        var parts = cookie.match(/(.*?)=(.*)$/)
        cookies[parts[1].trim()] = (parts[2] || '').trim();
    });
    return cookies;
};