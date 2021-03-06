module.exports = function () {
    return {
        files: [
            'test/**/*.html',
            'test/test_helper.js',
            'src/**/*.js'
        ],

        tests: [
            'test/**/*-specs.js'
        ],

        preprocessors: {
            '**/*.js': file => require('babel-core').transform(
                file.content,
                {sourceMap: true, presets: ['es2015']})
        },
        env: {
            type: 'node'
        },

        testFramework: "mocha",

        bootstrap: function () {
            require('./test/test_helper');
        }
    };
};