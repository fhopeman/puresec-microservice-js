var os = require('os');
var request = require("request");

var utils = function() {

    /**
     * Resolves the current IPv4 address of the application.
     *
     * @returns IPv4 address.
     */
    var currentAddress = function() {
        var networkInterfaces = os.networkInterfaces( );
        for (var networkInterface in networkInterfaces) {
            var iface = networkInterfaces[networkInterface];

            for (var i = 0; i < iface.length; i++) {
                var name = iface[i];
                if (name.address !== '127.0.0.1' && name.family === 'IPv4' && !name.internal) {
                    return "http://" + name.address;
                }
            }
        }
    };

    return {
        currentAddress: currentAddress
    };
};

var webApp = function() {

    var _healthCheckAction = function(customAction) {
        // provide the health check function which is used from nodejs health check endpoint
        // and add custom action to it
        return function(req, res) {
            if (!!customAction) {
                customAction(req, res);
            }
            res.send("UP");
        };
    };

    /**
     * Adds a health check to a nodejs application object.
     *
     * @param app nodejs application.
     * @param customAction optional callback which will be executed if
     *                     the health check is called.
     */
    var registerHealthCheckEndpoint = function(app, customAction) {
        app.get("/health", _healthCheckAction(customAction));
    };

    var _notificationAction = function(customAction) {
        // enhance the notification api with a custom action
        return function(req, res) {
            if (!!customAction) {
                customAction(req, res);
            }
            res.send("OK");
        };
    };

    /**
     * Adds a notification endpoint.
     *
     * @param app nodejs application.
     * @param customAction optional callback which will be executed if
     *                     the notification is received.
     */
    var registerNotificationEndpoint = function(app, customAction) {
        app.post("/notify", _notificationAction(customAction));
    };

    return {
        registerHealthCheckEndpoint: registerHealthCheckEndpoint,
        registerNotificationEndpoint: registerNotificationEndpoint
    };
};

var master = function(masterUrl) {

    /**
     * Registers a client at the master.
     *
     * @param options following options have to be defined:
     *                - type: type of client (e.g. handler, detector, ..)
     *                - name: name of client
     *                - description: description of client.
     *                - address: network address of client.
     *                - onSuccess (optional): on success callback function.
     *                - onError (optional): on error callback function.
     */
    var register = function(options) {
        request.post({
            uri: masterUrl + "/alarm/register/" + options.type,
            form: {
                name: options.name,
                description: options.description,
                url: options.address
            }
        }, function (error, _, body) {
            if (!error) {
                if (!!options.onSuccess) {
                    options.onSuccess(JSON.parse(body));
                }
            } else {
                if (!!options.onError) {
                    options.onError(error);
                }
            }
        });
    };

    /**
     * Notifies the master.
     *
     * @param options following options are available:
     *                - registrationId: has to be provided as unique id
     *                - onSuccess (optional): on success callback function.
     *                - onError (optional): on error callback function.
     */
    var notify = function(options) {
        request.post({
            uri: masterUrl + "/alarm/notify",
            form: {
                detector_id: options.registrationId
            }
        }, function(error, _, body) {
            if (!error) {
                if (!!options.onSuccess) {
                    options.onSuccess(JSON.parse(body));
                }
            } else {
                if (!!options.onError) {
                    options.onError(error);
                }
            }
        });
    };

    return {
        register: register,
        notify: notify
    };
};

module.exports = {
    utils: utils,
    master: master,
    webApp: webApp
};
