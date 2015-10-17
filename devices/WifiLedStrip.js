/**
 * Created by Gert on 1/09/2015.
 */
var winston = require("winston");
net = require('net');

function WifiLedStrip(service) {

    var self = this;
    // configure logger

    this.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({timestamp: true, prettyPrint: true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({
                filename: 'log/wifi_led.log',
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
    this.logger.info("Wifi Led Strip logger started");
    //register services

    service.registerService({
            type: 'get',
            path: 'ledstrip/red'
        }, function(req, res) {
            self.getColour('red', req, res);
        }
    );
    service.registerService({
            type: 'get',
            path: 'ledstrip/blue'
        }, function(req, res) {
            self.getColour('blue', req, res);
        }
    );
    service.registerService({
            type: 'get',
            path: 'ledstrip/green'
        }, function(req, res) {
            self.getColour('green', req, res);
        }
    );

    service.registerService({
            type: 'post',
            path: 'ledstrip/red'
        }, function(req, res, next) {
            self.setColour('red', req, res);
        }
    );
    service.registerService({
            type: 'post',
            path: 'ledstrip/green'
        }, function(req, res, next) {
            self.setColour('green', req, res);
        }
    );
    service.registerService({
            type: 'post',
            path: 'ledstrip/blue'
        }, function(req, res, next) {
            self.setColour('blue', req, res);
        }
    );

    this.logger.info("Services registered");



}

WifiLedStrip.prototype.getColour = function(colour, req, res) {
    var self = this;
    this.logger.debug("colour requested");
    var cmd;
    switch(colour) {
        case 'red':
            cmd = 'getRed';
            break;
        case 'blue':
            cmd = 'getBlue';
            break;
        case 'green':
            cmd = 'getGreen';
            break;
    }

    var client = net.connect(23, '192.168.1.107', function() {
        client.on('data', function(data) {
            //console.log(data.toString());
            self.logger.debug("Data received from led strip");
            res.end('{\"' + colour + "\":" + data.toString() + '}');
            client.end();
        });
        client.write(cmd);
        self.logger.debug("client connected");
    }); //TODO: remove hard coded ip
    client.setTimeout(5000, function() {
        self.logger.debug("Socket timeout");
        res.end("\"result\": socket timeout");
    });


}

WifiLedStrip.prototype.setColour = function(colour, req, res, next) {
    var cmd;
    switch(colour) {
        case 'red':
            cmd = 'setRed(' + req.body.value + ')';
            break;
        case 'blue':
            cmd = 'setBlue(' + req.body.value + ')';
            break;
        case 'green':
            cmd = 'setGreen(' + req.body.value + ')';
            break;
    }
    var client = net.connect(23, '192.168.1.107', function() {
        client.on('data', function(data) {
            //console.log(data.toString());

            client.end();
        });

        client.write(cmd);
        //TODO: temporary fix, led strip should give feedback
        res.end("{\"result\": ok}");
    }); //TODO: remove hard coded ip
    client.setTimeout(5000, function() {

        res.end("\"result\": socket timeout");
    });

}

module.exports = WifiLedStrip;