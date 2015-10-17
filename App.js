/**
 * Created by GeVr on 20/04/2015.
 */

var RestService = require("./RestService.js");
var Outlets = require("./devices/Outlets.js");
var ClimateController = require("./devices/ClimateController.js");
var WifiLedStrip = require("./devices/WifiLedStrip.js");
var Uart = require("./arduino/Uart.js");
var port = '8080';
var ssl = false;

for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i].indexOf("--ssl=true") > -1) {
        ssl = true;
    }
    else if (process.argv[i].indexOf("--port=") > -1) {
        port = parseInt(process.argv[i].substr(process.argv[i].indexOf("=") + 1));
    }
}

var uart = new Uart("/dev/ttyUSB0");
var serviceInstance = new RestService(port, {
    ssl: ssl
});
new Outlets(serviceInstance, uart);
new ClimateController(serviceInstance, uart);
new WifiLedStrip(serviceInstance);

