/**
 * Created by GeVr on 6/04/2015.
 */
var winston = require("winston");

function Outlets(service, uart) {

    var self = this;

    this.logger = new (winston.Logger)({
        transports: [
            //new (winston.transports.Console)({timestamp:true, prettyPrint:true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({ filename: 'log/outlets.log', timestamp: true, prettyPrint: true, maxsize: 10485760, maxFiles: 10 })
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
        desklight: false,
        twilight: false,
        uplighter: false,
        dual_twilight: false,
        saltlamp: false,
        vaporizer: false
    };

    //register to the uart
    uart.registerCallback(function (data) {
        self.notify(data);
    });

    service.registerService({
        path: '/outlets/all',
        type: 'get'
    }, function (req, res) {
        self.getAll(req, res);
    });

    service.registerService({
        path: '/outlets/desklight',
        type: 'get'
    }, function (req, res) {
        self.getOutlet(req, res, "desklight")
    });

    service.registerService({
        path: '/outlets/twilight',
        type: 'get'
    }, function (req, res) {
        self.getOutlet(req, res, "twilight")
    });

    service.registerService({
        path: '/outlets/uplighter',
        type: 'get'
    }, function (req, res) {
        self.getOutlet(req, res, "uplighter")
    });

    service.registerService({
        path: '/outlets/dual_twilight',
        type: 'get'
    }, function (req, res) {
        self.getOutlet(req, res, "dual_twilight")
    });

    service.registerService({
        path: '/outlets/saltlamp',
        type: 'get'
    }, function (req, res) {
        self.getOutlet(req, res, "saltlamp")
    });

    service.registerService({
        path: '/outlets/vaporizer',
        type: 'get'
    }, function (req, res) {
        self.getOutlet(req, res, "vaporizer")
    });

    //post services


    service.registerService({
        path: '/outlets/desklight',
        type: 'post'
    }, function (req, res, next) {
        self.postOutlet(req, res, next, "desklight")
    });

    service.registerService({
        path: '/outlets/twilight',
        type: 'post'
    }, function (req, res, next) {
        self.postOutlet(req, res, next, "twilight")
    });

    service.registerService({
        path: '/outlets/uplighter',
        type: 'post'
    }, function (req, res, next) {
        self.postOutlet(req, res, next, "uplighter")
    });

    service.registerService({
        path: '/outlets/dual_twilight',
        type: 'post'
    }, function (req, res, next) {
        self.postOutlet(req, res, next, "dual_twilight")
    });

    service.registerService({
        path: '/outlets/saltlamp',
        type: 'post'
    }, function (req, res, next) {
        self.postOutlet(req, res, next, "saltlamp")
    });

    service.registerService({
        path: '/outlets/vaporizer',
        type: 'post'
    }, function (req, res, next) {
        self.postOutlet(req, res, next, "vaporizer")
    });

}

Outlets.prototype.postOutlet = function (req, res, next, outlet) {
    var error = false;
    var errorTxt = "";
    var payload = req.body;
    console.log(payload);
    if (payload.value !== true && payload.value !== false) {
        error = true;
        errorTxt = "No true or false value found in value string";
    }
    else {
        switch (outlet) {
            case "dual_twilight":
                if (payload.value) {
                    this.uart.send("0000COMDSWON0");
                    this.states.dual_twilight = true;
                }
                if (!payload.value) {
                    this.uart.send("0000COMDSWOF0");
                    this.states.dual_twilight = false;
                }
                break;
            case "twilight":
                if (payload.value) {
                    this.uart.send("0000COMDSWON1");
                    this.states.twilight = true;
                }
                if (!payload.value) {
                    this.uart.send("0000COMDSWOF1");
                    this.states.twilight = false;
                }
                break;
            case "uplighter":
                if (payload.value) {
                    this.uart.send("0000COMDSWON2");
                    this.states.uplighter = true;
                }
                if (!payload.value) {
                    this.uart.send("0000COMDSWOF2");
                    this.states.uplighter = false;
                }
                break;
            case "desklight":
                if (payload.value) {
                    this.uart.send("0000COMDSWON3");
                    this.states.desklight = true;
                }
                if (!payload.value) {
                    this.uart.send("0000COMDSWOF3");
                    this.states.desklight = false;
                }
                break;
            case "saltlamp":
                if (payload.value) {
                    this.uart.send("0000COMDSWON4");
                    this.states.saltlamp = true;
                }
                if (!payload.value) {
                    this.uart.send("0000COMDSWOF4");
                    this.states.saltlamp = false;
                }
                break;
            case "vaporizer":
                if (payload.value) {
                    this.uart.send("0000COMDSWON5");
                    this.states.vaporizer = true;
                }
                if (!payload.value) {
                    this.uart.send("0000COMDSWOF5");
                    this.states.vaporizer = false;
                }
                break;
            default:
                error = true;
                errorTxt = "No valid outlet name was found";
                break;
        }
    }
    if(error == false) {
        res.writeHead(201, {
            'Content-Type': 'application/json'
        });
        res.write(JSON.stringify({result: "success"}));
        res.end();
    }
    else {
        res.writeHead(500, {
            'Content-Type': 'application/json'
        });
        res.write(JSON.stringify({
            result: "error",
            message: errorTxt
        }));
        res.end();
    }
};

Outlets.prototype.getOutlet = function (req, res, outlet) {
    res.writeHead(200);
    res.end("{\"" + outlet + "\":" + this.states[outlet]+ "}");
};

Outlets.prototype.notify = function (data) {
   // data = data.toString().replace(/\W/g, ''); //strip all the garbage
    this.logger.info("Outlets: serial data received: " + data);
    //here we will translate serial message into JSON messages

    var source = data.substr(0, 4);
    var type = data.substr(4,4);
    var param = data.substr(8,4);
    var value = data.substr(12);



    if(type === "STAT") {

        if (source === "0000") {
            this.logger.info("outlet status update received");
            if (param === "SWST") {
                //   logger.info("Switch state");
                var state = (value.substr(1, 1) === "1");
                // logger.info("state: " + state);
                switch (value.substr(0, 1)) {
                    case "1":
                        //logger.info("twilight");
                        this.states.twilight = state;
                        break;
                    case "2":
                        //logger.info("uplighter");
                        this.states.uplighter = state;
                        break;
                    case "0":
                        //logger.info("desklight");
                        this.states.desklight = state;
                        break;
                    case "3":
                        //logger.info("twilights");
                        this.states.dual_twilight = state;
                        break;
                    case "4":
                        //logger.info("saltlamp");
                        this.states.saltlamp = state;
                        break;
                    case "5":
                        //logger.info("twilights");
                        this.states.vaporizer = state;
                        break;
                    default:

                        break;
                }
            }

        }
    }
        //else: message not relevant for this class
};

Outlets.prototype.getAll = function(req, res) {
    res.writeHead(200);
    res.end(JSON.stringify(this.states));
};


module.exports = Outlets;