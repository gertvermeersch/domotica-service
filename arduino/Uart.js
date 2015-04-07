/**
 * Created by GeVr on 6/04/2015.
 */
winston = require('winston');

function Uart(serialPortDevice) {
    this.callbacks = [];
    var self = this;
    this.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({timestamp:true, prettyPrint:true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({ filename: 'serial.log', timestamp: true, prettyPrint: true })
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


    // open serial port interface
    // ...

}
Uart.prototype.registerCallback = function(callback) {
    this.callbacks[this.callbacks.length] = callback;
};

Uart.prototype.send = function(message) {
    // serial send message
    // ...
    console.log("got: " + message + " to send");
};

//on receive
Uart.prototype.receive = function(data) {
    this.logger.info("data received: " + data);
    for(var i = 0; i < this.callbacks.length; i++) {
        this.callbacks[i](data);
    }
};



module.exports = Uart;