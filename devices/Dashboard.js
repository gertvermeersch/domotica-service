/**
 * Created by GeVr on 7/04/2015.
 */
var winston = require('winston');
var fs = require('fs');

function Dashboard(uart, climate_control, outlets) {

	var self = this;
    
    this.logger = new (winston.Logger)({
        transports: [
            //new (winston.transports.Console)({timestamp: true, prettyPrint: true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({
                filename: 'log/climate_control.log',
                timestamp: true,
                prettyPrint: true,
                level: 'trace',
                maxsize: 10485760,
                maxFiles: 10
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

    this.uart = uart;
    this.climate_control = climate_control;
    this.outlets = outlets;

    

    setInterval(function() {
    	self.uart.send("ppppDISPTEMP" + climate_control.states.currentTemperature);
    	
    		self.uart.send("ppppDISPTTMP" + climate_control.states.targetTemperature);
    	
    	
    		self.uart.send("ppppDISPHUMY" + climate_control.states.currentHumidity);
    	
    	
    		self.uart.send("ppppDISPHEAT" + climate_control.states.heating);
    	
    	
    	
    },60000);



}

module.exports = Dashboard;
