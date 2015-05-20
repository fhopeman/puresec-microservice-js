var testee = require('../index');

var assert = require("assert");
var sinon = require("sinon");
var os = require("os");
var request = require("request");

describe("utils", function(){
    var utils = testee.utils();

    describe("address resolving", function() {
        afterEach(function () {
            os.networkInterfaces.restore();
        });

        it("should return current external IPv4 address", function(){
            sinon.stub(os, 'networkInterfaces').returns(
                {lo: [
                    {address: '127.0.0.1', family: 'IPv4', internal: true },
                    {address: '::1', family: 'IPv6', internal: true }
                ],
                    wlan0: [
                        {address: '192.168.0.7', family: 'IPv4', internal: false },
                        {address: 'someFancyAddress0', family: 'IPv6', internal: false },
                        {address: 'someFancyAddress2', family: 'IPv6', internal: false }
                    ]}
            );

            assert.equal(utils.currentAddress(), "http://192.168.0.7");
        });

        it("shouldn't return network address if no external IPv4 is available", function(){
            sinon.stub(os, 'networkInterfaces').returns(
                {lo: [
                    {address: '127.0.0.1', family: 'IPv4', internal: true },
                    {address: '::1', family: 'IPv6', internal: true }
                ],
                    wlan0: [{address: 'someFancyAddress0', family: 'IPv6', internal: false },
                        {address: 'someFancyAddress2', family: 'IPv6', internal: false }
                    ]}
            );

            assert.equal(utils.currentAddress(), undefined);
        });
    });
});

describe("webApp", function(){
    var webApp = testee.webApp();

    describe("health check endpoint registration", function() {
        it("should add application endpoint /health", function() {
            // given
            var app = {
                get: function () {}
            };
            var appSpy = sinon.spy(app, "get");

            // when
            webApp.registerHealthCheckEndpoint(app);

            // then
            assert(appSpy.withArgs("/health", sinon.match.func).calledOnce);
        });

        it("should set up health check body and call custom action", function() {
            // given
            var customActionSpy = sinon.spy();
            var res = {send: function() {}};
            var resSpy = sinon.spy(res, "send");
            var app = {
                get: function(path, healthCheckBody) {
                    healthCheckBody({}, res);
                }
            };

            // when
            webApp.registerHealthCheckEndpoint(app, customActionSpy);

            // then
            assert(customActionSpy.calledOnce);
            assert(resSpy.withArgs("UP").calledOnce);
        });

        it("should set up health check body and don't call custom action if undefined", function() {
            // given
            var app = {
                get: function(path, healthCheckAction) {
                    healthCheckAction({}, {send: function() {}});
                }
            };

            // when
            webApp.registerHealthCheckEndpoint(app, undefined);

            // then
            // nothing to check, will fail if undefined would be executed
        });
    });

    describe("notify endpoint registration", function() {
        it("should add application endpoint /notify", function() {
            // given
            var app = {
                post: function () {}
            };
            var appSpy = sinon.spy(app, "post");

            // when
            webApp.registerNotificationEndpoint(app);

            // then
            assert(appSpy.withArgs("/notify", sinon.match.func).calledOnce);
        });

        it("should set up notify body and call custom action", function() {
            // given
            var customActionSpy = sinon.spy();
            var res = {send: function() {}};
            var resSpy = sinon.spy(res, "send");
            var app = {
                post: function(path, notifyAction) {
                    notifyAction({}, res);
                }
            };

            // when
            webApp.registerNotificationEndpoint(app, customActionSpy);

            // then
            assert(customActionSpy.calledOnce);
            assert(resSpy.withArgs("OK").calledOnce);
        });

        it("should set up notify body and don't call custom action if undefined", function() {
            // given
            var app = {
                post: function(path, notificationAction) {
                    notificationAction({}, {send: function() {}});
                }
            };

            // when
            webApp.registerNotificationEndpoint(app, undefined);

            // then
            // nothing to check, will fail if undefined would be executed
        });
    });

});

describe("master", function(){
    var master = testee.master("http://some/url/to/master");

    afterEach(function () {
        request.post.restore();
    });

    describe("registration", function() {
        var registrationDefaultOptions = {
            type: "handler",
            name: "some name",
            description: "some descr",
            address: "http://some/client/address",
            onSuccess: undefined,
            onError: undefined
        };

        it("should register a client and call success callback", function(done){
            sinon.stub(request, "post").yields(null, null, JSON.stringify({id: "7"}));

            registrationDefaultOptions.onSuccess = function(jsonBody) {
                assert.equal(jsonBody.id, 7);
                done();
            };
            master.register(registrationDefaultOptions);
        });

        it("should call onError callback if error occurs", function(done){
            sinon.stub(request, "post").yields({error: "connect ECONNREFUSED"}, null, null);

            registrationDefaultOptions.onError = function(error) {
                assert.equal(error.error, "connect ECONNREFUSED");
                done();
            };
            master.register(registrationDefaultOptions);
        });
    });

    describe("notification", function() {
        var notificationDefaultOptions = {
            registrationId: 13,
            onSuccess: undefined,
            onError: undefined
        };
        it("should notify the master and call success callback", function(done){
            sinon.stub(request, "post").yields(null, null, JSON.stringify({notified: [7, 9]}));

            notificationDefaultOptions.onSuccess = function(jsonBody) {
                assert.equal(jsonBody.notified[0], 7);
                assert.equal(jsonBody.notified[1], 9);
                done();
            };
            master.notify(notificationDefaultOptions);
        });

        it("should call onError callback if error occurs", function(done){
            sinon.stub(request, "post").yields({error: "connect ECONNREFUSED"}, null, null);

            notificationDefaultOptions.onError = function(error) {
                assert.equal(error.error, "connect ECONNREFUSED");
                done();
            };
            master.notify(notificationDefaultOptions);
        });
    });
});
