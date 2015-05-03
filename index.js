var os = require('os');
var request = require("request");

var utils = function() {

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
    var register = function (options) {
        request.post({
            uri: masterUrl + "/alarm/register/" + options.type,
            form: {
                name: options.name,
                description: options.description,
                url: options.address
            }
        }, function (error, _, body) {
            if (!error) {
                if (options.onSuccess) {
                    options.onSuccess(JSON.parse(body));
                }
            } else {
                if (options.onError) {
                    options.onError(error);
                }
            }
        });
    };

    return {
        register: register
    };
};

module.exports = {
    utils: utils,
    master: master
};
