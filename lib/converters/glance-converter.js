"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = {
    set: function set(cast, target, store) {
        var key = target.key;
        var value = target.value;
        var glance = cast.glance;

        var fullKey = key;

        if (target.context.length > 0) fullKey = target.context.join(">") + ">" + key;

        return glance.set(fullKey, value).then(function () {
            target.handled = true;
            return target;
        });
    },
    get: function get(cast, target, store) {
        var key = target.key;
        var context = target.context;
        var glance = cast.glance;

        var fullKey = key;

        if (target.context.length > 0) fullKey = target.context.join(">") + ">" + key;

        return glance.get(fullKey).then(function (currentValue) {
            return {
                key: key,
                value: currentValue,
                context: context,
                handled: true
            };
        });
    },
    process: function process(cast, target, store) {
        if (_typeof(target.value) == "object") {
            target.context.push(target.key);
            return Promise.resolve(target);
        }

        return this.set(cast, target, store);
    }
};