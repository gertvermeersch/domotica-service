/**
 * Created by GeVr on 6/04/2015.
 */
var restify = require('restify');
var winston = require('winston');
var fs = require('fs');

function RestService(port, options) {

    var self = this;

    this.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({timestamp: true, prettyPrint: true, colorize: true, level: 'trace'}),
            new (winston.transports.File)({
                filename: 'service.log',
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

    if(options.ssl == false)
        this.server = restify.createServer({
        name: "DomoticaServer"
        });
    else
        this.server = restify.createServer({
            key: fs.readFileSync('/etc/nginx/ssl/ssl.key'),
            certificate: fs.readFileSync('/etc/nginx/ssl/ssl-unified.crt'),
            name: "DomoticaServer"
        });


    //Prepare the service to accept authorization and CORS requests
    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser());

    this.server.use(restify.authorizationParser());
    this.server.use(restify.CORS({origins: ['*'], credentials: true}));
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
        else if(req.authorization.basic.username == "domoticaApp" && req.authorization.basic.password == "D0m0t1c4") {
            return next();
        }
        else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Backend authorization required!"');
            res.end('Wrong credentials found');
            logger.info("Authentication failed");
        }

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

}


//Register a service + callback
RestService.prototype.registerService = function(options, callback) {
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



module.exports = RestService;

