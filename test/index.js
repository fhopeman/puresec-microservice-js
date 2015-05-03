var testee = require('../index');

var assert = require("assert");
var sinon = require("sinon");
var os = require("os");

describe("microservice utils", function(){

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

        assert.equal(testee.currentAddress(), "http://192.168.0.7");
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

        assert.equal(testee.currentAddress(), undefined);
    });

});
