"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _glance = require("@quasimatic/glance");

var _glance2 = _interopRequireDefault(_glance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function trySet(cast, key, value, context) {
    var glance = cast.glance;

    var fullKey = key;
    if (context.parentContainerSelector && context.parentContainerSelector != "") fullKey = context.parentContainerSelector + ">" + key;

    return glance.set(fullKey, value).then(function () {
        return cast.setAfterHooks.reduce(function (p1, p2) {
            return p1.then(function () {
                return p2(cast, key, value);
            });
        }, Promise.resolve());
    });
}

function glanceSet(state, cast, context) {
    var _this = this;

    var glance = cast.glance;

    return Object.keys(state).reduce(function (p1, key) {
        return p1.then(function () {
            if (cast.literals[key]) {
                return Promise.resolve(cast.literals[key](_this, key, state[key], context));
            } else {
                var values = state[key];
                if (!Array.isArray(values)) {
                    values = [values];
                }

                return values.reduce(function (setP, value) {
                    return setP.then(function () {
                        var newContext = { key: key };

                        if (context && context.parentContainerSelector && context.parentContainerSelector != "") newContext.parentContainerSelector = context.parentContainerSelector + ">" + key;

                        if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object") {
                            if (!newContext.parentContainerSelector) newContext.parentContainerSelector = key;

                            return glanceSet(value, cast, newContext);
                        } else {
                            return trySet(cast, key, value, newContext);
                        }
                    });
                }, Promise.resolve());
            }
        });
    }, Promise.resolve());
}

var setStrategies = [glanceSet];

var Cast = function () {
    function Cast(options) {
        _classCallCheck(this, Cast);

        this.glance = new _glance2.default(options);

        this.beforeAll = options.beforeAll || [];
        this.afterAll = options.afterAll || [];

        this.literals = options.literals || {};

        this.setAfterHooks = options.setAfterHooks || [];
    }

    _createClass(Cast, [{
        key: "apply",
        value: function apply(state) {
            var _this2 = this;

            var states;

            if (Array.isArray(state)) states = state;else states = [state];

            return this.beforeAll.reduce(function (p1, func) {
                return p1.then(function () {
                    return func(_this2, state);
                });
            }, Promise.resolve()).then(function () {
                return states.reduce(function (p1, state) {
                    return p1.then(function () {
                        return _this2._eachSetStrategy(state, _this2);
                    });
                }, Promise.resolve()).then(function () {
                    return _this2.afterAll.reduce(function (p1, hook) {
                        return p1.then(function () {
                            return hook.call(new _glance2.default(_this2.glance));
                        });
                    }, Promise.resolve());
                });
            });
        }
    }, {
        key: "end",
        value: function end() {
            return this.glance.webdriverio.end();
        }
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