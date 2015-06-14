# puresec-microservice-js [![Build Status](https://travis-ci.org/fhopeman/puresec-microservice-js.svg?branch=master)](https://travis-ci.org/fhopeman/puresec-microservice-js)

This library is part of the [puresec ecosystem](https://github.com/fhopeman/puresec-master). It defines the macro architecture for every nodejs microservice. That means it provides functionality which has to be implemented by all services. E.g. the health check is part of that common macro architecture.

If you will build up your own nodejs microservice, this library helps you to concentrate on the real funcionality.

## Usage

The current tag can be defined as dependency in the `package.json` file:

```
"dependencies": {
   [some other dependencies],
   "puresec-microservice-js": "git://github.com/fhopeman/puresec-microservice-js.git#x.y.z"
}
```

Now it's possible to bind the predefined API calls to your application:

```
var app = express();
var master = puresecMicroservice.master(urlMaster);
var utils = puresecMicroservice.utils();
var webApp = puresecMicroservice.webApp();

// register healthcheck endpoint
webApp.registerHealthCheckEndpoint(app);

// register notification endpoint if app is a handler
webApp.registerNotificationEndpoint(app, function(req, res) {
    // some callback action when handler receives notification
});

// start application and perform master registration
app.listen(port, function () {
    master.register({
        name: "some name",
        description: "some description",
        type: "[handler|detector]",
        address: utils.currentAddress(port),
        onSuccess: function(jsonBody) {
            // some success callback action
        },
        onError: function(error) {
            // some error callback action
        }
    });
});

```

Example usages can be looked up [here](https://github.com/fhopeman/puresec-handler-signal).

## Contribution
Feel free to contribute!
