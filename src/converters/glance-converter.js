export default {
    set(cast, target, store) {
        var key = target.key;
        var value = target.value;
        var glance = cast.glance;

        var fullKey = key;

        if (target.context.length > 0)
            fullKey = target.context.join(">") + ">" + key;

        return glance.set(fullKey, value).then(function() {
            target.handled = true;
            return target;
        })
    },

    get(cast, target, store) {
        var key = target.key;
        var context = target.context;
        var glance = cast.glance;

        var fullKey = key;

        if (target.context.length > 0)
            fullKey = target.context.join(">") + ">" + key;

        return glance.get(fullKey)
            .then(currentValue => {
                return {
                    key: key,
                    value: currentValue,
                    context: context,
                    handled: true
                };
            });
    },

    process(cast, target, store) {
        if (typeof(target.value) == "object") {
            target.context.push(target.key);
            return Promise.resolve(target);
        }

        return this.set(cast, target, store)
    }
}