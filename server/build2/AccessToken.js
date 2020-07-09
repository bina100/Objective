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

    verifyToken(token) {
        //TODO - if access token is expired- delete it from the req(cookie) and from db.
        //find in db
        var query = 'select * from access_token where id = "' + token + '";'
        console.log("query:", query);
        return new Promise((resolve, reject) => {
            this.connection.query(query, function (err, result) {
                // check result
                console.log("r: ", result)
                if (err) {
                    return reject({ success: false, error: err })
                }
                else if (result.length === 0) {
                    return reject({ success: false, error: "not found" })
                }
                else {
                    let current_date = new Date()
                    if (current_date > result[0].valid_until) {
                        //date out of bound
                        return reject({ success: false, error: "out_of_time" })
                    }
                    else {
                        //
                        return resolve({ user: result[0].username, role: result[0].role });
                    }
                }
            });
        })
        //2 - check date
    }
    getTokenFromReq(req, res, next) {
        console.log("path: ", req.path)
        console.log('req: ', req.query)
        if ('/userExist' === req.path)
            return next();
        (async () => {
            let token = req.query.access_token || get_cookies(req)['access_token'];
            console.log('get token: ', token);
            // let token=req.query.AccessToken || req.headers.cookie;
            if (token) {
                try {
                    let res = await this.verifyToken(token);
                    req.options = { access_token: res };
                    return next();
                }
                catch (error) {
                    console.log("error on verify token:", error);
                    return res.end("Failed")

                }
            }
            else {
                console.log("req", req)
                return res.end("Failed")
            }
        })()
    }
}

// module.exports.


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


var get_cookies = function (request) {
    var cookies = {};
    request.headers && request.headers.cookie.split(';').forEach(function (cookie) {
        var parts = cookie.match(/(.*?)=(.*)$/)
        cookies[parts[1].trim()] = (parts[2] || '').trim();
    });
    return cookies;
};