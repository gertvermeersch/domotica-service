/**
 * Created by GeVr on 7/04/2015.
 */
var winston = require('winston');
var fs = require('fs');


function ClimateController(service, uart) {
    var self = this;
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

    this.uart = uart;

    this.states = {
        shutoff: false,
        athome: false,
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
            self.configReadCallback(self);
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
    uart.registerCallback(function (data) {
        self.notify(data);
    })




}

ClimateController.prototype.notify = function (data) {
    winston.info("ClimateController: data received: " + data);
    if (data.indexOf("STATHEAT") > -1) {
        this.states.heating = data.substr(12, 1) == "1" ? true : false;
    }
    if (data.indexOf("STATTEMP") > -1) {
        this.states.currentTemperature = parseFloat(data.substr(12, 4));
    }
    if (data.indexOf("STATHUMY") > -1) {
        this.states.currentHumidity = parseFloat(data.substr(12, 4));
    }
    if (data.indexOf("STATTTMP") > 1) {
        this.states.targetTemperature = parseInt(data.substr(12, 2));
    }
    console.log(this.states);
};

ClimateController.prototype.postShutoff = function (req, res, next) {
    this.states.shutoff = req.body.value;
    res.writeHead(201);
    res.end(JSON.stringify({result: "ok"}));
};

ClimateController.prototype.postAthome = function (req, res, next) {
    this.states.athome = req.body.value;
    res.writeHead(201);
    res.end(JSON.stringify({result: "ok"}));
};

ClimateController.prototype.getShutoff = function (req, res) {
    res.writeHead(200);
    res.end(JSON.stringify({shutoff: this.states.shutoff}));
};

ClimateController.prototype.getAthome = function (req, res) {
    res.writeHead(200);
    res.end(JSON.stringify({athome: this.states.athome}));
};

ClimateController.prototype.postConfig = function (req, res, next) {
    //some basic input filtering:
    this.updateConfig(req.body, function () {
        res.writeHead(201);
        res.end(JSON.stringify({result: "ok"}));
    })
};

ClimateController.prototype.getConfigReq = function (req, res) {

    res.writeHead(200);
    res.end(JSON.stringify(this._config.heating));
};

ClimateController.prototype.getSensors = function (req, res) {
    res.writeHead(200);
    res.end(JSON.stringify(this.states));
};

ClimateController.prototype.configReadCallback = function () {
    var self = this;
    //at startup set the correct target temperature, only do this after a config file is present
    this.logger.info("Config file is read, checking target temperature");

    this.updateTargetTemperature();
    setInterval(function () {
        self.updateTargetTemperature();
    }, 10000); //every 10 minutes

};

ClimateController.prototype.updateTargetTemperature = function () {
    var controller = this;
    this.logger.debug("Checking the target temperature");


    var newValue = controller.getCurrentTargetTemperature();

    if (controller.states.targetTemperature != newValue) {
        this.logger.debug("Target temperature update to " + newValue);
        controller.uart.send("wwwwSETVTTMP" + newValue);
    } else
        this.logger.debug("Target temperature still ok");
};


ClimateController.prototype.getConfig = function () {
    return this._config;
};


ClimateController.prototype.readConfig = function (callback) {
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

ClimateController.prototype.createConfig = function (callback) {
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
    fs.writeFile("heating.conf", JSON.stringify(default_config), function (error) {
        if (error) {
            this.logger.error("Could not write config file: " + error);
            callback(error);
        }
        else {
            this.logger.info("Default config file written");
            callback();
        }
    })
};

ClimateController.prototype.updateConfig = function (newConfig, callback) {

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
        fs.writeFile("heating.conf", JSON.stringify(this._config), function (error) {
            if (error) {
                this.logger.error("Could not write config file: " + error);
                callback(error);
            }
            else {
                this.logger.info("Config file written");
                callback();
            }
        });
    } catch (ex) {
        callback(ex);
    }

};

ClimateController.prototype.getCurrentTargetTemperature = function (date) {
    var now = date ? date : new Date();

    var nowInt = "" +
        (now.getHours() < 10 ? "0" + now.getHours() : now.getHours()) +
        (now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes());

    if (now.getDay() == 6 || now.getDay() == 0) { //weekend
        this.logger.debug("we are in the weekend");
        var startInt = this._config.heating.weekend_start_time.substr(0, 2) + this._config.heating.weekend_start_time.substr(3, 2);
        var endInt = this._config.heating.weekend_stop_time.substr(0, 2) + this._config.heating.weekend_stop_time.substr(3, 2);
        if (nowInt > startInt && nowInt < endInt) {
            this.logger.debug("we are at home");
            return this._config.heating.temperature_present;
        }
        else {
            this.logger.debug("we are away");
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
            return this._config.heating.temperature_present;
        }
        else {
            this.logger.debug("we are away");
            return this._config.heating.temperature_away;
        }

    }
};


module.exports = ClimateController;
