/**
 * Created by GeVr on 7/04/2015.
 */
 "use strict";
var winston = require('winston');
var fs = require('fs');
var request = require('request');

class ClimateController{

    constructor(context, address) {
        this.hcp = {
            deviceid: '3edc73e5-e6c4-45aa-835f-683eeca53678',
            token: '45cb5de87425b12341113324ab33fac',
            path: 'https://iotmmsp1546307770trial.hanatrial.ondemand.com/com.sap.iotservices.mms/v1/api/http/data/'
        }
        
        var self = this;
        this.datalogger = context.datalogger;
        this.logger = context.logger;
        this.address = address;
        this.uart = context.uart;
        var service = context.restservice;

        this.states = {
            shutoff: false,
            athome: false,
            override_athome: false,
            override_away: false,
            currentTemperature: 0,
            currentHumidity: 0,
            targetTemperature: 0,
            heating: false
        };

        this.readConfig(function (error, config) {
            if (error) {
                self.logger.warn("Error while reading the configuration file, a new file will be created");
                self.createConfig(function (error) {
                    if (error) {
                        throw new Error("Could not write configuration file -- exitting program");
                    } else {
                        self.readConfig(function (error) {
                            if (error) throw error;
                            self.configReadCallback();
                        });
                    }
                })
            } else {
                self.logger.info("Config file read: " + JSON.stringify(config));
                self._config = config;
                //at startup set the correct target temperature, only do this after a config file is present
                self.logger.info("Config file is read, checking target temperature");

                self.updateTargetTemperature();
                setInterval(function () {
                    self.updateSensor();
                    
                }, 300000); //every 5 minutes
            }
        });

        //register services

        service.registerService({
            path: '/climate/sensors',
            type: 'get'
        }, function (req, res) {
            self.getSensors(req, res)
        });

        service.registerService({
            path: '/climate/config',
            type: 'get'
        }, function (req, res) {
            self.getConfigReq(req, res)
        });

        service.registerService({
            path: '/climate/at_home',
            type: 'get'
        }, function (req, res) {
            self.getAthome(req, res)
        });

        service.registerService({
            path: '/climate/shut_off',
            type: 'get'
        }, function (req, res) {
            self.getShutoff(req, res)
        });


        service.registerService({
            path: '/climate/config',
            type: 'post'
        }, function (req, res, next) {
            self.postConfig(req, res, next);
        });

        service.registerService({
            path: '/climate/at_home',
            type: 'post'
        }, function (req, res, next) {
            self.postAthome(req, res, next)
        });

        service.registerService({
            path: '/climate/shut_off',
            type: 'post'
        }, function (req, res, next) {
            self.postShutoff(req, res, next)
        });

        //register to the uart
        this.uart.registerCallback(function (data) {
            self.notify(data);
        })
    };

    updateHCP() {
        var self = this;
        date = new Date();
        var post_data = {
            "mode":"sync",
            "messageType":"c0e680fb709a009d8829",
            "messages":[
                {"timestamp": date.getTime(),
                "temperature": this.states.currentTemperature,
                "targettemperature": this.states.targetTemperature,
                "heatingon":this.states.heating,
                "humidity":this.states.currentHumidity
                }
            ]
        }

        request({
        url: this.hcp.path + this.hcp.deviceid,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.hcp.token
        },
        body: JSON.stringify(post_data) //Set the body as a string
        }, function(error, response, body){
            if(error) {
                self.logger.error(error);
            } else {
                if(response.statusCode !== 200) {
                    self.logger.warn("while posting sensordata to HCP: " + body);
                }
            }
        });
        
    };

    updateMysql() {
        var self = this;
        if(typeof self.datalogger !== 'undefined' && self.datalogger) {
            self.datalogger.insertSensor("temperature", this.states.currentTemperature.toString());
            self.datalogger.insertSensor("targettemperature", this.states.targetTemperature.toString());
            self.datalogger.insertSensor("heatingon", this.states.heating.toString());
            self.datalogger.insertSensor("humidity", this.states.currentHumidity.toString());
        } else {
            self.logger.warn("No datalogger defined");
        }
    }

    notify(data) {
        this.logger.info("ClimateController: data received: " + data);
        
        if (data.indexOf("STATHEAT") > -1) {
            this.states.heating = data.substr(12, 1) == "1";
            this.i++;
        }
        if (data.indexOf("STATTEMP") > -1) {
            this.states.currentTemperature = parseFloat(data.substr(12, 4));
            this.i++;
            
        }
        if (data.indexOf("STATHUMY") > -1) {
            this.states.currentHumidity = parseFloat(data.substr(12, 4));
            this.i++;
        }
        if (data.indexOf("STATTTMP") > -1) {
            this.states.targetTemperature = parseInt(data.substr(12, 2));
            this.updateTargetTemperature(); //seems to cause problems 2/11/2015
            this.i++;
        }
        if(this.i = 4) {
            this.i = 0;
            this.updateMysql();
        }

    };

    postShutoff(req, res, next) {
        this.states.shutoff = req.body.value;
        res.writeHead(201);
        res.end(JSON.stringify({result: "ok"}));

    };

    postAthome(req, res, next) {
        if(req.body.value) {
            this.states.override_athome = true;
            this.states.override_away = false;
        }
        else {
            this.states.override_away = true;
            this.states.override_athome = false;
        }
        res.writeHead(201);
        res.end(JSON.stringify({result: "ok"}));
    };

    getShutoff(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify({shutoff: this.states.shutoff}));
    };

    getAthome(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify({athome: this.states.athome}));
    };

    postConfig(req, res, next) {
        //some basic input filtering:
        this.updateConfig(req.body, function () {
            res.writeHead(201);
            res.end(JSON.stringify({result: "ok"}));
        })
    };

    getConfigReq(req, res) {

        res.writeHead(200);
        res.end(JSON.stringify(this._config.heating));
    };

    getSensors(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify(this.states));
    };



    updateSensor() {
        this.uart.send(this.address + "REQTTEMP");
        this.uart.send(this.address + "REQTHEAT");
        this.uart.send(this.address + "REQTTTMP");
        this.uart.send(this.address + "REQTHUMY");
        this.i = 0;
    };

    updateTargetTemperature() {
        var self = this;
        this.logger.debug("Checking the target temperature");
        var newValue = self.getCurrentTargetTemperature();
        var newTemperature = newValue;
        if(newValue === this.oldValue) { //the scheduled temperature hasn't changed yet so we keep the overrides if set
            newTemperature = newValue
            if(this.states.override_away) {
                newTemperature = this._config.heating.temperature_away;
            }
            else if(this.states.override_athome) {
                newTemperature = this._config.heating.temperature_present;
            }
        } else {
            //reset the overrides
            this.states.override_away = false;
            this.states.override_athome = false;
            newTemperature = newValue;
        }


        if (self.states.targetTemperature != newTemperature) { //new value so reset the overrides
            this.logger.debug("Target temperature update to " + newTemperature);
            this.states.targetTemperature = newTemperature;
            if (newTemperature < 10)
                newTemperature = '0' + newTemperature;
            self.uart.send(self.address + "SETVTTMP" + newTemperature);
        } else
            this.logger.debug("Target temperature still ok");


        this.oldValue = newValue;
    };





    readConfig(callback) {
        //var self = this;
        try {
            fs.readFile("heating.conf", function (error, data) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(null, JSON.parse(data));
                }
            })
        } catch (ex) {
            callback(ex);
        }

    };

    createConfig(callback) {
        var default_config = {
            heating: {
                temperature_present: 20,
                temperature_away: 16,
                weekend_start_time: "09:00",
                weekend_stop_time: "23:00",
                week_start_morning: "07:00",
                week_end_morning: "09:00",
                week_start_evening: "16:00",
                week_end_evening: "22:00"
            }
        };
        var self = this;
        fs.writeFile("heating.conf", JSON.stringify(default_config), function (error) {
            if (error) {
                self.logger.error("Could not write config file: " + error);
                callback(error);
            }
            else {
                self.logger.info("Default config file written");
                callback();
            }
        })
    };

    updateConfig(newConfig, callback) {

        try {
            this.logger.info("Payload received: " + JSON.stringify(newConfig));
            //var _newConfig = JSON.parse(newConfig);
            this._config.heating.temperature_away = newConfig.temperature_away;
            this._config.heating.temperature_present = newConfig.temperature_present;
            this._config.heating.weekend_start_time = newConfig.weekend_start_time;
            this._config.heating.weekend_stop_time = newConfig.weekend_stop_time;
            this._config.heating.week_start_morning = newConfig.week_start_morning;
            this._config.heating.week_end_morning = newConfig.week_end_morning;
            this._config.heating.week_start_evening = newConfig.week_start_evening;
            this._config.heating.week_end_evening = newConfig.week_end_evening;
            this.logger.info("New values: " + JSON.stringify(this._config));
            var self = this;
            fs.writeFile("heating.conf", JSON.stringify(this._config), function (error) {
                if (error) {
                    self.logger.error("Could not write config file: " + error);
                    callback(error);
                }
                else {
                    self.logger.info("Config file written");
                    callback();
                }
            });
        } catch (ex) {
            callback(ex);
        }

    };

    getCurrentTargetTemperature(date) {

        if (this.states.shutoff == true)
            return "0";
        else {
            var now = new Date();
    	    now = new Date(now.getTime() + 3600000);
            
    		
    		
     
            var nowInt = "" +
                (now.getHours() < 10 ? "0" + now.getHours() : now.getHours()) +
                (now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes());

            if (now.getDay() == 6 || now.getDay() == 0) { //weekend
                this.logger.debug("we are in the weekend");
                var startInt = this._config.heating.weekend_start_time.substr(0, 2) + this._config.heating.weekend_start_time.substr(3, 2);
                var endInt = this._config.heating.weekend_stop_time.substr(0, 2) + this._config.heating.weekend_stop_time.substr(3, 2);
                if (nowInt > startInt && nowInt < endInt) {
                    this.logger.debug("we are at home");
                    this.states.athome = true;
                    return this._config.heating.temperature_present;
                }
                else {
                    this.logger.debug("we are away");
                    this.states.athome = false;
                    return this._config.heating.temperature_away;
                }
            }
            else { //week
                var startMorningInt = this._config.heating.week_start_morning.substr(0, 2) + this._config.heating.week_start_morning.substr(3, 2);
                var endMorningInt = this._config.heating.week_end_morning.substr(0, 2) + this._config.heating.week_end_morning.substr(3, 2);


                var startEveningInt = this._config.heating.week_start_evening.substr(0, 2) + this._config.heating.week_start_evening.substr(3, 2);
                var endEveningInt = this._config.heating.week_end_evening.substr(0, 2) + this._config.heating.week_end_evening.substr(3, 2);
                this.logger.debug("we are in the week");
                if ((nowInt > startMorningInt && nowInt < endMorningInt) || (nowInt > startEveningInt && nowInt < endEveningInt)) {
                    this.logger.debug("we are at home");
                    this.states.athome = true;
                    return this._config.heating.temperature_present;
                }
                else {
                    this.logger.debug("we are away");
                    this.states.athome = false;
                    return this._config.heating.temperature_away;
                }

            }
        }
    };
}

module.exports = ClimateController;
