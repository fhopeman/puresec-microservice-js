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

    describe("health check registration", function() {
        it("should add application endpoint /health", function() {
            // given
            var app = {
                get: function () {}
            };
            var appSpy = sinon.spy(app, "get");

            // when
            utils.addHealthCheck(app);

            // then
            assert(appSpy.withArgs("/health", sinon.match.func).calledOnce);
        });

        it("should set up health check body and call custom callback", function() {
            // given
            var customCallbackSpy = sinon.spy();
            var res = {send: function() {}};
            var resSpy = sinon.spy(res, "send");
            var app = {
                get: function(path, healthCheckBody) {
                    healthCheckBody({}, res);
                }
            };

            // when
            utils.addHealthCheck(app, customCallbackSpy);

            // then
            assert(customCallbackSpy.calledOnce);
            assert(resSpy.withArgs("UP").calledOnce);
        });

        it("should set up health check body and don't call custom callback if undefined", function() {
            // given
            var app = {
                get: function(path, healthCheckBody) {
                    healthCheckBody({}, {send: function() {}});
                }
            };

            // when
            utils.addHealthCheck(app, undefined);

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
            utils.addNotifyEndpoint(app);

            // then
            assert(appSpy.withArgs("/notify", sinon.match.func).calledOnce);
        });

        it("should set up notify body and call custom callback", function() {
            // given
            var customCallbackSpy = sinon.spy();
            var res = {send: function() {}};
            var resSpy = sinon.spy(res, "send");
            var app = {
                post: function(path, notifyBody) {
                    notifyBody({}, res);
                }
            };

            // when
            utils.addNotifyEndpoint(app, customCallbackSpy);

            // then
            assert(customCallbackSpy.calledOnce);
            assert(resSpy.withArgs("OK").calledOnce);
        });

        it("should set up notify body and don't call custom callback if undefined", function() {
            // given
            var app = {
                post: function(path, notifyBody) {
                    notifyBody({}, {send: function() {}});
                }
            };

            // when
            utils.addNotifyEndpoint(app, undefined);

            // then
            // nothing to check, will fail if undefined would be executed
        });
    });

});

describe("master", function(){
    var master = testee.master("http://some/url/to/master");

    var defaultOptions = {
        type: "handler",
        name: "some name",
        description: "some descr",
        address: "http://some/client/address",
        onSuccess: undefined,
        onError: undefined
    };

    afterEach(function () {
        request.post.restore();
    });

    it("should register a client and call success callback", function(done){
        sinon.stub(request, "post").yields(null, null, JSON.stringify({id: "7"}));

        defaultOptions.onSuccess = function(jsonBody) {
            assert.equal(jsonBody.id, 7);
            done();
        };
        master.register(defaultOptions);
    });

    it("should call onError callback if error occurs", function(done){
        sinon.stub(request, "post").yields({error: "connect ECONNREFUSED"}, null, null);

        defaultOptions.onError = function(error) {
            assert.equal(error.error, "connect ECONNREFUSED");
            done();
        };
        master.register(defaultOptions);
    });

});
