/**
 * Created by GeVr on 6/04/2015.
 */

function Outlets(service, uart) {
    var self = this;
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
    console.log(req.body);
    var payload = JSON.parse(req.body);
    switch (outlet) {
        case "desklight":
            if (payload.value == true)
                this.uart.send("0000COMDSWON1");
            if (payload.value == false)
                this.uart.send("0000COMDSWOF1");
            break;
        default:
            break;
    }
    res.writeHead(201, {
        'Content-Type': 'application/json'
    });
    res.write(JSON.stringify({result: "success"}));
    res.end();
};

Outlets.prototype.getOutlet = function (req, res, outlet) {
    res.end(JSON.stringify({
        device: outlet,
        state: this.states[outlet]
    }));
};

Outlets.prototype.notify = function (data) {
    console.log("notified! " + data);

};


module.exports = Outlets;