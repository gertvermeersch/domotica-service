/**
 * Created by GeVr on 6/04/2015.
 */
 "use strict";
var restify = require('restify');
var winston = require('winston');
var fs = require('fs');
var path = require('path');

class RestService {
        constructor(port, options, context) {

        var self = this;

        this.logger = context.logger;
        this.db = context.datalogger;

        if(options.ssl == false)
            this.server = restify.createServer({
            name: "DomoticaServer"
            });
        else
            this.server = restify.createServer({
                key: fs.readFileSync(path.resolve(__dirname, 'ssl.key')),
                certificate: fs.readFileSync(path.resolve(__dirname, 'ssl-unified.crt')),
                name: "DomoticaServer"
            });


        //Prepare the service to accept authorization and CORS requests
        this.server.use(restify.queryParser());
        this.server.use(restify.bodyParser());

        this.server.use(restify.authorizationParser());
        //this.server.use(restify.CORS({origins: ['*'], credentials: true}));
        this.server.use(restify.CORS());
        this.server.use(restify.fullResponse());
        restify.CORS.ALLOW_HEADERS.push('authorization'); //allow authorization

        //Sets up basic authentication of the server
        this.server.use(function authenticate(req, res, next) {
            //console.log(req.authorization.basic);
            if(req.authorization.basic == undefined) {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Backend authorization required!"');
                res.end('No credentials found');
            }
            else{(self.db.checkLogin(req.authorization.basic.username, req.authorization.basic.password, function(result) {
                    if(result === true) {
                        return next();
                    }
                    else {
                        res.statusCode = 401;
                        res.setHeader('WWW-Authenticate', 'Basic realm="Backend authorization required!"');
                        res.end('Wrong credentials found');
                        logger.info("Authentication failed from " + req.connection.remoteAddress);
                    }
                })) 
            }

        });

        this.server.use(function logConnection(req, res, next){
            self.logger.info("Connection made from " + req.connection.remoteAddress);
            return next();
        });

        //set timeout of requests and responses (allow for long polling)
        this.server.use(function (req, res, next) {
            // This will set the idle timer to 10 minutes
            req.connection.setTimeout(5000);
            res.connection.setTimeout(5000); //**Edited**
            next();
        });

        //start listening on designated port
        this.server.listen(port, function () {
            self.logger.info('%s listening at %s ',self.server.name, self.server.url);

        });

        this.server.get({
            path: '/'
        },
        function(req, res) {
            res.end("Domotica Server on Raspberry Pi");
        })

    }


    //Register a service + callback
    registerService(options, callback) {
        if(options.type == 'get') {
            this.server.get({
                path: options.path
            }, function(req, res) {
                callback(req, res);
            });
        }
        else if(options.type == 'post') {
            this.server.post({
                path: options.path
            }, function(req, res, next) {
                callback(req, res, next);
            });
        }
    };

}

module.exports = RestService;

