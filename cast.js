#!/usr/bin/env node

var fs = require('fs');
var Cast = require('./lib/cast').default;
var cast = new Cast({
    capabilities: [{
        browserName: 'firefox'
    }],
    baseUrl: 'http://localhost',
    waitforTimeout: 5000
});

var commandLineArgs = require('command-line-args');

var cli = commandLineArgs([
    {name: 'files', type: String, multiple: true, defaultOption: true},
]);

var options = cli.parse()
var files = options.files;

files.reduce(function(p1, file) {
    var data = fs.readFileSync(file, "utf8");
    return p1.then(function() {
        return cast.set(JSON.parse(data))
    });
}, Promise.resolve()).catch(function(err) {
    console.error(err.message);
});