/**
 * Created by GeVr on 6/04/2015.
 */
winston = require('winston');
serialport = require("serialport");

function Uart(serialPortDevice, logger) {
    this.queue = [];
    this.callbacks = [];
    var self = this;
    this.logger = logger;


    this.serialPort = new serialport.SerialPort(serialPortDevice, {
        baudrate: 115200,
        parser: serialport.parsers.readline("\r")
    }, true);

    this.serialPort.on('data', function(data) {
        self.receive(data);
    });

    this.serialPort.on('open', function(error) {
        self.onSerialReady(error)
    });
}

Uart.prototype.onSerialReady = function(error) {
    
    if(error) {
        this.logger.warn(error);

    }
    else
        var self = this;
        setInterval(function() {
            self.sendOneMessage();
        },500);
        this.logger.info("serial port opened");
};
Uart.prototype.registerCallback = function(callback) {
    this.callbacks[this.callbacks.length] = callback;
};

Uart.prototype.send = function(message) {
    this.queue.push(message);
    

};

 Uart.prototype.sendOneMessage = function() {
     
    if(this.queue.length > 0) {
        var message = this.queue.shift();
        message = "<" + message  + ">";
        if(message.length > 32)
            this.logger.error("Message is too long! max = 32 byte");
        else {
            var serialBuffer = new Buffer(message.length);
            serialBuffer.write(message);
            //serialBuffer.fill("0",message.length,31);
            this.logger.info(serialBuffer.toString());
            this.serialPort.write(serialBuffer);
            this.logger.info("Message: \"" + serialBuffer.toString() + "\" sent");
        }
    }
 }

//on receive
Uart.prototype.receive = function(data) {
    data = data.replace(/(\r\n|\n|\r)/gm,"");
    this.logger.info("Received: " + data);
    for(var i = 0; i < this.callbacks.length; i++) {
        this.callbacks[i](data.substr(0, 32));
    }
};





module.exports = Uart;
