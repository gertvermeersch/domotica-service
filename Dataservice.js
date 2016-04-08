"use strict";
var express = require('express');
var web = express();
var fs = require('fs');
var winston = require('winston');
var mysql = require('mysql');


class Dataservice {
    constructor() {
        var self = this;
    	this.logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({timestamp: true, prettyPrint: true, colorize: true, level: 'trace'}),
                new (winston.transports.File)({
                    filename: 'log/dataservice.log',
                    timestamp: true,
                    prettyPrint: true,
                    level: 'trace'
                })
            ],
            levels: {
                trace: 0,
                debug: 1,
                info: 2,
                warn: 3,
                error: 4
            },
            colors: {
                trace: 'magenta',
                debug: 'blue',
                info: 'green',
                warn: 'yellow',
                error: 'red'
            }

        });

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
                self.registerServices();
            }
                
        
        });
	
	

    }


    registerServices() {
        var self = this;
        web.get('/readData', function(req, res) {
            var query = "select * from messages order by timestamp desc";
            self.pool.query(query, function(err, results) {
                self.logger.trace(req.params);
                if(req.query.format == 'json') {
                    res.append('Content-Type', 'application/json');
                    res.send(JSON.stringify(self.getFormattedData(results)));
                }
                else if(req.query.format == 'csv') {
                    res.append('Content-Type', 'application/text');
                    res.send(self.toCSV(self.getFormattedData(results)));
                }
                else {
                    res.send("Please specify format parameter");
                }

            })

        });

        web.listen(8080, function() {
            self.logger.info("dataservice started");
        });
    }

    getFormattedData(result) {
        var self = this;
        var formattedArray = {};
        for(var i = 0; i < result.length; i++) {
            var timestamp = result[i].timestamp;
            var sensor = result[i].sensor;
            var value = result[i].value;
            if(formattedArray[timestamp] === undefined || formattedArray[timestamp] === null) {
                formattedArray[timestamp] = {};
            }
            formattedArray[timestamp][sensor] = value;
        }
        return formattedArray;

    }

    toCSV(formattedResult) {
        var self = this;
        var csv = "timestamp,heatingon,temperature,targettemperature,humidity\n\r";
        for(var key in formattedResult) {
            csv += key + "," + formattedResult[key].heatingon + "," + formattedResult[key].temperature + "," + formattedResult[key].targettemperature + "," + formattedResult[key].humidity + "\n\r";
        }
        return csv;
    }
}

module.exports = Dataservice;

var dataservice = new Dataservice();