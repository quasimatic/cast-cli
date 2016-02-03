'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _glanceWebdriver = require('glance-webdriver');

var _glanceWebdriver2 = _interopRequireDefault(_glanceWebdriver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
}, function glaceSet(state, urlHooks, glance) {
    return Object.keys(state).reduce(function (p1, key) {
        return p1.then(function () {
            return glance.set(key, state[key]);
        });
    }, Promise.resolve());
}];

var Cast = function () {
    function Cast(options) {
        _classCallCheck(this, Cast);

        this.glance = new _glanceWebdriver2.default(options);
        this.urlHooks = options.urlHooks;
    }

    _createClass(Cast, [{
        key: 'set',
        value: function set(state) {
            var _this = this;

            var states;

            if (Array.isArray(state)) states = state;else states = [state];

            return states.reduce(function (p1, s) {
                return p1.then(function () {
                    return _this.eachSetStrategy(s, _this.urlHooks, glance);
                });
            }, Promise.resolve());
        }
    }, {
        key: 'get',
        value: function get() {}
    }, {
        key: 'eachSetStrategy',
        value: function eachSetStrategy(s, urlHooks, glance) {
            return setStrategies.reduce(function (p1, setStrategy2) {
                return p1.then(function () {
                    return setStrategy2(s, urlHooks, glance);
                });
            }, Promise.resolve());
        }
    }]);

    return Cast;
}();

exports.default = Cast;