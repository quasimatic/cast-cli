"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function() {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

var _glance = require("@quasimatic/glance");

var _glance2 = _interopRequireDefault(_glance);

require("./promise-array");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var glanceConverter = function() {
    function glanceConverter() {
        _classCallCheck(this, glanceConverter);
    }

    _createClass(glanceConverter, [{
        key: "set",
        value: function set(cast, target, store) {
            var _this = this;

            if (_typeof(target.value) == "object") {
                target.context.push(target.key);
                return Promise.resolve(target);
            }

            var key = target.key;
            var value = target.value;
            var glance = cast.glance;

            var fullKey = key;

            if (target.context.length > 0) fullKey = target.context.join(">") + ">" + key;

            return glance.set(fullKey, value).then(function() {
                return cast.setAfterHooks.resolveSeries(function(hook) {
                    return hook(cast, key, value);
                });
            }).then(function() {
                _this.continue = true;
                return _this;
            });
        }
    }, {
        key: "get",
        value: function get(cast, target, store) {
            var _this2 = this;

            if (_typeof(target.value) == "object") {
                target.context.push(target.key);
                return Promise.resolve(target);
            }

            var key = target.key;
            var context = target.context;
            var glance = cast.glance;

            var fullKey = key;

            if (target.context.length > 0) fullKey = target.context.join(">") + ">" + key;

            return glance.get(fullKey).then(function(currentValue) {
                _this2.continue = true;
                console.log({
                    key: key,
                    value: currentValue,
                    context: context
                });
                return {
                    key: key,
                    value: currentValue,
                    context: context
                };
            });
        }
    }, {
        key: "isResolved",
        value: function isResolved() {
            return !this.continue;
        }
    }]);

    return glanceConverter;
}();

var converters = [glanceConverter];

function processTargets(cast, state, store, parentTarget) {
    return Object.keys(state).resolveSeries(function(key) {
        var values = [].concat(state[key]);

        return values.resolveSeries(function(value) {
            var target = {
                key: key,
                value: state[key],
                context: parentTarget ? parentTarget.context : []
            };

            return converters.firstResolved(function(converter) {
                return new converter().set(cast, target, store);
            }).then(function(c) {
                if (!c.isContext()) {
                    return c.get(cast, target, store).then(function(newTarget) {
                        return processTargets(cast, value, store, newTarget);
                    });
                }
            });
        });
    });
}

var Cast = function () {
    function Cast(options) {
        _classCallCheck(this, Cast);

        this.glance = new _glance2.default(options);

        this.beforeAll = options.beforeAll || [];
        this.afterAll = options.afterAll || [];

        this.setAfterHooks = options.setAfterHooks || [];
        this.literals = options.literals || [];
    }

    _createClass(Cast, [{
        key: "apply",
        value: function apply(state) {
            var _this3 = this;

            var stores = [];
            var states = [].concat(state);

            return states.resolveSeries(function(state) {
                var store = {
                    desiredState: state,
                    currentState: {}
                };

                return _this3.beforeAll.resolveSeries(function(beforeAll) {
                    return beforeAll(_this3, store);
                }).then(function() {
                    return processTargets(_this3, state, store);
                }).then(function() {
                    return _this3.afterAll.resolveSeries(function(afterAll) {
                        return afterAll(_this3, store);
                    });
                }).then(function() {
                    return stores.push(store);
                });
            }).then(function() {
                if (stores.length == 1) {
                    return stores[0].currentState;
                } else {
                    return stores.map(function(s) {
                        return s.currentState;
                    });
                }
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
    }]);

    return Cast;
}();

exports.default = Cast;