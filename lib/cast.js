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
    if (context.containerSelector && context.containerSelector != "") fullKey = context.containerSelector + ">" + key;

    return glance.set(fullKey, value).then(function () {
        return cast.setAfterHooks.reduce(function (p1, p2) {
            return p1.then(function () {
                return p2(cast, key, value);
            });
        }, Promise.resolve());
    });
}

function glanceSet(cast, state, context, OLDCONTEXT) {
    var _this = this;

    var glance = cast.glance;

    return Object.keys(state).reduce(function (p1, key) {
        return p1.then(function () {
            if (cast.literals[key]) {
                return Promise.resolve(cast.literals[key](_this, key, context[key], OLDCONTEXT));
            } else {
                var values = state[key];
                if (!Array.isArray(values)) {
                    values = [values];
                }

                return values.reduce(function (setP, value) {
                    return setP.then(function () {
                        var newContext = { key: key };

                        if (OLDCONTEXT && OLDCONTEXT.containerSelector && OLDCONTEXT.containerSelector != "") newContext.containerSelector = OLDCONTEXT.containerSelector + ">" + key;

                        if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object") {
                            if (!newContext.containerSelector) newContext.containerSelector = key;

                            return glanceSet(cast, value, context, newContext);
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

            var contexts = [];

            return states.reduce(function (p1, state) {
                return p1.then(function () {
                    var context = {
                        desiredState: state,
                        currentState: {}
                    };

                    return _this2.beforeAll.reduce(function (p1, beforeAllHook) {
                        return p1.then(function () {
                            return beforeAllHook(_this2, context);
                        });
                    }, Promise.resolve()).then(function () {
                        return _this2._eachSetStrategy(_this2, state, context);
                    }).then(function () {
                        return _this2.afterAll.reduce(function (p1, afterAllHook) {
                            return p1.then(function () {
                                context = afterAllHook(_this2, context);
                            });
                        }, Promise.resolve());
                    }).then(function () {
                        return contexts.push(context);
                    });
                });
            }, Promise.resolve()).then(function () {
                if (contexts.length == 1) {
                    return contexts[0].currentState;
                } else {
                    return contexts.map(function (c) {
                        return c.currentState;
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
    }, {
        key: "_eachSetStrategy",
        value: function _eachSetStrategy(context, state, cast) {
            return setStrategies.reduce(function (p1, setStrategy) {
                return p1.then(function () {
                    return setStrategy(context, state, cast);
                });
            }, Promise.resolve());
        }
    }]);

    return Cast;
}();

exports.default = Cast;