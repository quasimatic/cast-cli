#!/usr/bin/env node
import {Cast} from 'glance-webdriver';

var fs = require('fs');
var commandLineArgs = require('command-line-args');

var options = commandLineArgs([
    {name: 'files', type: String, multiple: true, defaultOption: true},
]);

var files = options.files;
var config = require(process.cwd() + "/cast.conf.js")

var cast = new Cast(config);

files.reduce(function(p1, file) {
        var data = fs.readFileSync(file, "utf8");
        return p1.then(function() {
            return cast.apply(JSON.parse(data))
        });
    },
    Promise.resolve()).then(function() {
        cast.end();
    },
    function(err) {
        console.error(err.message);
    }
)