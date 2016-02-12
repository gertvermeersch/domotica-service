"use strict";

var ClimateController = require("./devices/ClimateController.js");

class Broker {
	constructor(context) {
	    var self = this;
	    
	    this.restservice = context.restservice;
	    this.uart = context.uart;
	    this.logger = context.logger;
	    this.datalogger = context.datalogger;
	    this.context = context;

	    //hard coded 
	    this.createClimateController();
	    
	    
	}

	createClimateController() {
		
		
		this.climateController = new ClimateController(this.context, "wwww");
	}

}

module.exports = Broker;