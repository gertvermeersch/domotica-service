
"use strict";
var winston = require('winston');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
var sha1 = require('sha1');
class Persistence{

    constructor(context){
	var self = this;

    this.logger = context.logger;

    fs.readFile(path.resolve(__dirname, 'db_cred.txt'), function(err, data) {
		if(err) {
			self.logger.error(err);
			throw(err);
		}
		else {
			self.db_cred = JSON.parse(data);
            self.pool = mysql.createPool({
                connectionLimit: 5,
                host     : self.db_cred.host,
                user     : self.db_cred.user,
                password : self.db_cred.password,
                database : self.db_cred.database
            });
            self.pool.on('connection', function(connection) {
                self.logger.trace("new connection created");
            });
            
            self.pool.on('error', function(err) {
                self.logger.error("Database error: " + err.code);
            });
        		}
			
	
	   });
    }

    insertSensor(sensor, value) {
        var self = this;
        this.pool.query("INSERT into messages SET ?", {sensor: sensor, value: value}, function(err, result) {
            if(err) {
                self.logger.error(err);
            }
            else {
                self.logger.trace(result);
            }
          });

    }

    checkLogin(user, pass, callback) {
        var self = this;
        var hash = sha1(pass);
        //user = mysql.escape(user);
        this.pool.query("SELECT count(*) as count from users where username = ? and hash = ?", [user, hash], function(err, result) {
            if(err) {
                self.logger.error(err);
            }
            else {
                if( result[0].count === 1) {
                    self.logger.info("Authentication for user " + user + " accepted");
                    callback(true);
                } else {
                    self.logger.info("Authentication for user " + user + " failed");
                    callback(false);
                }
            }
        })


    }


}



module.exports = Persistence;

