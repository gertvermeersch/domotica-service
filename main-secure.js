/**
 * Created by GeVr on 6/04/2015.
 */
var RestService = require("./RestService.js");
var Outlets = require("./devices/Outlets.js");
var Uart = require("./arduino/Uart.js");
var port = '9443';


var uart = new Uart("/dev/ttyUSB0");
var serviceInstance = new RestService(port, {
    ssl: true
});
var outlets = new Outlets(serviceInstance, uart);

