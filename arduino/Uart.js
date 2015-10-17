/**
 * Created by GeVr on 6/04/2015.
 */
winston = require('winston');
serialport = require("serialport");

function Uart(serialPortDevice) {
    this.callbacks = [];
    var self = this;
    this.logger = new (winston.Logger)({
        transports: [
            //new (winston.transports.Console)({timestamp:true, prettyPrint:true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({ filename: 'log/serial.log', timestamp: true, prettyPrint: true, maxsize: 10485760, maxFiles: 10 })
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


    this.serialPort = new serialport.SerialPort(serialPortDevice, {
        baudrate: 115200,
        parser: serialport.parsers.readline("\r")
    }, true);

    this.serialPort.on('data', function(data) {
        self.receive(data);
    });

    this.serialPort.on('open', function(error) {self.onSerialReady(error)});
}

Uart.prototype.onSerialReady = function(error) {
    if(error)
        this.logger.warn(error);
    else
        this.logger.info("serial port opened");
};
Uart.prototype.registerCallback = function(callback) {
    this.callbacks[this.callbacks.length] = callback;
};

Uart.prototype.send = function(message) {

    if(message.length > 32)
        this.logger.error("Message is too long! max = 32 byte");
    else {
        var serialBuffer = new Buffer(32);
        serialBuffer.fill("0");

        serialBuffer.write(message);
        //serialBuffer.fill("0",message.length,31);
        this.logger.info(serialBuffer.toString());
        this.serialPort.write(serialBuffer);
        this.logger.info("Message: \"" + serialBuffer.toString() + "\" sent");
    }

 };

//on receive
Uart.prototype.receive = function(data) {

    for(var i = 0; i < this.callbacks.length; i++) {
        this.callbacks[i](data.substr(0, 32));
    }
};





module.exports = Uart;