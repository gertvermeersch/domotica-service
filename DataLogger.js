
"use strict";
var winston = require('winston');
var mysql = require('mysql');
var fs = require('fs');

class DataLogger{

    constructor(logger){
	 var self = this;

    this.logger = logger;

    fs.readFile('db_cred.txt', function(err, data) {
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


}



module.exports = DataLogger;

