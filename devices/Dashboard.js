/**
 * Created by GeVr on 7/04/2015.
 */
 "use strict";
var winston = require('winston');
var fs = require('fs');

class Dashboard{
    constructor(context, address, climate_control, outlets) {

    	var self = this;
        
        this.logger = context.logger;

        this.uart = context.uart;
        this.climate_control = climate_control;
        this.outlets = outlets;
        this.address = address;
        this.outlets = context.outlets;

        

        setInterval(function() {
        	self.uart.send(address + "DISPTEMP" + climate_control.states.currentTemperature);
        	
        		self.uart.send(address + "DISPTTMP" + climate_control.states.targetTemperature);
        	
        	
        		self.uart.send(address + "DISPHUMY" + climate_control.states.currentHumidity);
        	
        	
        		self.uart.send(address + "DISPHEAT" + climate_control.states.heating);
        	
        	
        	
        },60000);



    }
}
module.exports = Dashboard;
