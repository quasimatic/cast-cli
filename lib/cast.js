"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _glanceWebdriver = require("glance-webdriver");

var _glanceWebdriver2 = _interopRequireDefault(_glanceWebdriver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function trySet(glance, key, state, remainingKeys, parentStack) {
    parentStack = parentStack || [];
    var parents = remainingKeys.slice();
    var fullKey = key;
    if (parentStack.length > 0) fullKey = parentStack.join(">") + ">" + key;

    console.log("trySet", key, fullKey, state[key]);

    return new Promise(function (resolve, reject) {
        glance.set(fullKey, state[key]).then(function (value) {
            console.log("THEN:", value);
            resolve(value);
        }, function (reason) {
            console.log("CATCH:", reason);

            var parent = parents.shift();
            if (parent) {
                parentStack.push(parent);
                console.log('here');
                return trySet(glance, key, state, parents, parentStack).then(resolve, reject);
                //return Promise.reject();
            }

            reject(reason);
        });
    });

    /*.catch((reason)=> {
     //        console.log("Error:", err)
     var parent = parents.shift();
     if (parent) {
     parentStack.push(parent);
     return trySet(glance, key, state, parents, parentStack)
     }
     else {
     console.log("Throwing error")
     return Promise.reject(reason)
     }
     });*/
}

function glanceSet(state, urlHooks, glance, parentKeys) {
    parentKeys = parentKeys || [];

    return new Promise(function (resolve, reject) {
        Object.keys(state).reduce(function (p1, key) {
            return p1.then(function () {
                if (_typeof(state[key]) == "object") {
                    parentKeys.unshift(key);
                    return glanceSet(state[key], urlHooks, glance, parentKeys);
                } else {

                    return trySet(glance, key, state, parentKeys);
                }
            });
        }, Promise.resolve()).then(resolve, reject);
    });
}

var setStrategies = [function url(state, urlHooks, glance) {
    var url = state['$URL$'];
    if (url) {
        delete state['$URL$'];
        return glance.url(url).then(function () {
            return urlHooks.reduce(function (p1, hook) {
                return p1.then(function () {
                    return hook.call(new _glanceWebdriver2.default(glance), url);
                });
            }, Promise.resolve());
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