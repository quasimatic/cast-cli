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

function trySet(cast, key, state, context) {
    var glance = cast.glance;

    var fullKey = key;
    if (context.parentContainerSelector && context.parentContainerSelector != "") fullKey = context.parentContainerSelector + ">" + key;

    return glance.set(fullKey, state[key]).then(function () {
        return cast.setAfterHooks.reduce(function (p1, p2) {
            return p1.then(function () {
                return p2(cast, key, state[key]);
            });
        }, Promise.resolve());
    });
}

function glanceSet(state, cast, context) {
    var glance = cast.glance;

    return Object.keys(state).reduce(function (p1, key) {
        return p1.then(function () {
            var newContext = { key: key };

            if (context && context.parentContainerSelector && context.parentContainerSelector != "") newContext.parentContainerSelector = context.parentContainerSelector + ">" + key;

            if (_typeof(state[key]) == "object") {
                if (!newContext.parentContainerSelector) newContext.parentContainerSelector = key;

                return glanceSet(state[key], cast, newContext);
            } else {
                return trySet(cast, key, state, newContext);
            }
        });
    }, Promise.resolve());
}

var setStrategies = [glanceSet];

var Cast = function () {
    function Cast(options) {
        _classCallCheck(this, Cast);

        this.glance = new _glanceWebdriver2.default(options);
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
        value: function _eachSetStrategy(state, cast) {
            return setStrategies.reduce(function (p1, setStrategy) {
                return p1.then(function () {
                    return setStrategy(state, cast);
                });
            }, Promise.resolve());
        }
    }]);

    return Cast;
}();

exports.default = Cast;