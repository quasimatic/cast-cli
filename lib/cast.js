"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _glanceWebdriver = require("glance-webdriver");

var _glanceWebdriver2 = _interopRequireDefault(_glanceWebdriver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function trySet(glance, key, state, parentKeys) {
    var parents = parentKeys.slice();

    //  return new Promise(function(resolve, reject) {
    //    console.log("trySet", key, state[key])
    return glance.set(key, state[key]).then(function () {
        console.log("Resolved");
        return Promise.resolve();
    }).catch(function () {
        console.log("Error");
        var parent = parents.shift();
        console.log(parent);
        if (parent) return trySet(glance, parent + ">key", state, parents);else return Promise.reject();
    });
    //})
}

function glanceSet(state, urlHooks, glance, parentKeys) {
    parentKeys = parentKeys || [];
    console.log("GlanceSet", state);

    return Object.keys(state).reduce(function (p1, key) {
        return p1.then(function () {
            if (_typeof(state[key]) == "object") {
                console.log(key, ": Object");
                parentKeys.unshift(key);
                return glanceSet(state[key], urlHooks, glance, parentKeys);
            } else {
                return trySet(glance, key, state, parentKeys);
            }
        });
    }, Promise.resolve());
}

var setStrategies = [function url(state, urlHooks, glance) {
    var url = state['$URL$'];
    if (url) {
        delete state['$URL$'];
        return new Promise(function (resolve, reject) {
            glance.url(url).then(function () {
                return urlHooks.reduce(function (p1, hook) {
                    return p1.then(function () {
                        return hook(url, glance);
                    });
                }, Promise.resolve()).then(resolve);
            });
        });
    }

    return glance;
}, glanceSet];

var Cast = function () {
    function Cast(options) {
        _classCallCheck(this, Cast);

        this.glance = new _glanceWebdriver2.default(options);
        this.urlHooks = options.urlHooks;
    }

    _createClass(Cast, [{
        key: "set",
        value: function set(state) {
            var _this = this;

            var states;

            if (Array.isArray(state)) states = state;else states = [state];

            return states.reduce(function (p1, state) {
                return p1.then(function () {
                    return _this.eachSetStrategy(state, _this.urlHooks, glance);
                });
            }, Promise.resolve());
        }
    }, {
        key: "get",
        value: function get() {}
    }, {
        key: "eachSetStrategy",
        value: function eachSetStrategy(state, urlHooks, glance) {
            return setStrategies.reduce(function (p1, setStrategy) {
                return p1.then(function () {
                    return setStrategy(state, urlHooks, glance);
                });
            }, Promise.resolve());
        }
    }]);

    return Cast;
}();

exports.default = Cast;