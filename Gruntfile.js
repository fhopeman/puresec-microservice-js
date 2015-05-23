module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            files: [
                "Gruntfile.js",
                "index.js",
                "test/**/*.js"
            ]
        },
        mochaTest: {
            files: [ 'test/**/*.js' ]
        },
        mochaTestConfig: {
            options: {
                reporter: 'spec',
                ui: 'tdd'
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask("travis-ci", ["jshint", "mochaTest"]);
    grunt.registerTask("default", ["jshint", "mochaTest"]);

};
