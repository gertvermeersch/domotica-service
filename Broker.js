"use strict";
var Dashboard = require('./devices/Dashboard.js');

var ClimateController = require("./devices/ClimateController.js");

class Broker {
	constructor(context) {
	    var self = this;
	    
	    this.restservice = context.restservice;
	    this.uart = context.uart;
	    this.logger = context.logger;
	    this.datalogger = context.datalogger;
	    this.context = context;

	    this.climateController = new ClimateController(this.context, "wwww");
	    this.dashboard = new Dashboard(context, "pppp", this.climateController);
	   
	    //hard coded 
	   
	    
	    
	}



}

module.exports = Broker;