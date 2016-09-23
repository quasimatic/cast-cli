#!/usr/bin/env node
import {Cast} from 'glance-webdriver';

let fs = require('fs');
let commandLineArgs = require('command-line-args');

let options = commandLineArgs([
    {name: 'files', type: String, multiple: true, defaultOption: true},
]);

let files = options.files;
let config = require(process.cwd() + "/cast.conf.js");

let promise = config.init ? config.init(config) : Promise.resolve(config);

promise.then((config) => {
    let cast = new Cast(config);

    return files.reduce((p1, file) => p1.then(() => cast.apply(JSON.parse(fs.readFileSync(file, "utf8")))), Promise.resolve())
        .then(() => cast.end(), err => console.error(err.message));
});