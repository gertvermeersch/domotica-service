/**
 * Created by GeVr on 20/04/2015.
 */
"use strict";
var RestService = require("./RestService.js");
var Outlets = require("./devices/Outlets.js");

var WifiLedStrip = require("./devices/WifiLedStrip.js");
var DataLogger = require("./DataLogger.js");
var Uart = require("./arduino/Uart.js");
var Dashboard = require("./devices/Dashboard.js");
var Broker = require("./Broker.js");
var port = '8080';
var ssl = false;
var winston = require('winston');





for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i].indexOf("--ssl=true") > -1) {
        ssl = true;
    }
    else if (process.argv[i].indexOf("--port=") > -1) {
        port = parseInt(process.argv[i].substr(process.argv[i].indexOf("=") + 1));
    }
}

class App {
    constructor(ssl, port) {
        this.logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({timestamp:true, prettyPrint:true, colorize: true, level: 'trace'}),
                new (winston.transports.File)({ filename: 'log/domotica.log', colorize: true, timestamp: true, prettyPrint: true, maxsize: 10485760, maxFiles: 10 })
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
        this.uart = new Uart("/dev/ttyUSB0", this.logger);
        this.restservice = new RestService(port, {
            ssl: ssl
        }, this.logger);
        this.datalogger = new DataLogger(this.logger);
        this.outlets = new Outlets(this);

        this.broker = new Broker(this);
        
    }
}

var app = new App(ssl, port);


