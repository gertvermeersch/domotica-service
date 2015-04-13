/**
 * Created by GeVr on 7/04/2015.
 */
var winston = require('winston');
var fs = require('fs');


function ClimateController(service, uart) {
    this.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({timestamp: true, prettyPrint: true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({
                filename: '/home/gert/domotica/climate_control.log',
                timestamp: true,
                prettyPrint: true,
                level: 'trace'
            })
        ],
        levels: {
            trace: 0,
            input: 1,
            verbose: 2,
            prompt: 3,
            debug: 4,
            info: 5,
            data: 6,
            help: 7,
            warn: 8,
            error: 9
        },
        colors: {
            trace: 'magenta',
            input: 'grey',
            verbose: 'cyan',
            prompt: 'grey',
            debug: 'blue',
            info: 'green',
            data: 'grey',
            help: 'cyan',
            warn: 'yellow',
            error: 'red'
        }
    });
}




module.exports = ClimateController;
