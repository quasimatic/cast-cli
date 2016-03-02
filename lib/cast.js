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

function trySet(cast, key, state, remainingKeys, parentStack) {
    var glance = cast.glance;

    parentStack = parentStack || [];
    var parents = remainingKeys.slice();
    var fullKey = key;
    if (parentStack.length > 0) fullKey = parentStack.join(">") + ">" + key;

    return new Promise(function (resolve, reject) {
        glance.set(fullKey, state[key]).then(function () {
            return cast.setAfterHooks.reduce(function (p1, p2) {
                return p1.then(function () {
                    return p2(cast, key, state[key]);
                });
            }, Promise.resolve()).then(resolve, reject);
        }, function (reason) {
            var parent = parents.shift();
            if (parent) {
                parentStack.push(parent);
                return resolve(trySet(cast, key, state, parents, parentStack));
            }

            return reject(reason);
        });
    });
}

function glanceSet(state, cast, parentKeys) {
    var urlLoadedHooks = cast.urlLoadedHooks;
    var urlChangingHooks = cast.urlChangingHooks;
    var glance = cast.glance;

    parentKeys = parentKeys || [];

    return Object.keys(state).reduce(function (p1, key) {
        return p1.then(function () {
            if (_typeof(state[key]) == "object") {
                parentKeys.unshift(key);
                return glanceSet(state[key], cast, parentKeys);
            } else {
                return trySet(cast, key, state, parentKeys);
            }
        });
    }, Promise.resolve());
}

var setStrategies = [function url(state) {
    var urlLoadedHooks = cast.urlLoadedHooks;
    var urlChangingHooks = cast.urlChangingHooks;
    var glance = cast.glance;

    var url = state['$URL$'];
    if (url) {
        delete state['$URL$'];

        return glance.then(function () {
            return urlChangingHooks.reduce(function (p1, hook) {
                return p1.then(function () {
                    return hook.call(new _glanceWebdriver2.default(glance), url);
                });
            }, Promise.resolve());
        }).url(url).then(function () {
            return urlLoadedHooks.reduce(function (p1, hook) {
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
        this.urlLoadedHooks = options.urlLoadedHooks || [];
        this.urlChangingHooks = options.urlChangingHooks || [];
        this.endHooks = options.endHooks || [];
        this.setAfterHooks = options.setAfterHooks || [];
    }

    _createClass(Cast, [{
        key: "set",
        value: function set(state) {
            var _this = this;

            var states;

            if (Array.isArray(state)) states = state;else states = [state];

            return states.reduce(function (p1, state) {
                return p1.then(function () {
                    return _this._eachSetStrategy(state, _this);
                });
            }, Promise.resolve()).then(function () {
                return _this.endHooks.reduce(function (p1, hook) {
                    return p1.then(function () {
                        return hook.call(new _glanceWebdriver2.default(_this.glance));
                    });
                }, Promise.resolve());
            });
        }
    }, {
        key: "get",
        value: function get() {}
    }, {
        key: "addSetAfterHook",
        value: function addSetAfterHook(func) {
            this.setAfterHooks.push(func);
        }
    }, {
        key: "_eachSetStrategy",
        value: function _eachSetStrategy(state, urlLoadedHooks, urlChangingHooks, glance) {
            return setStrategies.reduce(function (p1, setStrategy) {
                return p1.then(function () {
                    return setStrategy(state, urlLoadedHooks, urlChangingHooks, glance);
                });
            }, Promise.resolve());
        }
    }]);

    return Cast;
}();

exports.default = Cast;