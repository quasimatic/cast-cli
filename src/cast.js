import Glance from "glance-webdriver";

function trySet(glance, key, state, remainingKeys, parentStack) {
    parentStack = parentStack || [];
    var parents = remainingKeys.slice();
    var fullKey = key;
    if (parentStack.length > 0)
        fullKey = parentStack.join(">") + ">" + key

    return new Promise((resolve, reject)=> {
        glance.set(fullKey, state[key]).then(resolve,
            (reason)=> {
                var parent = parents.shift();
                if (parent) {
                    parentStack.push(parent);
                    return resolve(trySet(glance, key, state, parents, parentStack))
                }

                return reject(reason);
            });
    });
}

function glanceSet(state, urlLoadedHooks, urlChangingHooks, glance, parentKeys) {
    parentKeys = parentKeys || [];

    return Object.keys(state).reduce((p1, key) => p1.then(()=> {
        if (typeof(state[key]) == "object") {
            parentKeys.unshift(key)
            return glanceSet(state[key], urlLoadedHooks, urlChangingHooks, glance, parentKeys);
        }
        else {
            return trySet(glance, key, state, parentKeys)
        }
    }), Promise.resolve())
}

var setStrategies = [
    function url(state, urlLoadedHooks, urlChangingHooks, glance) {
        var url = state['$URL$'];
        if (url) {
            delete state['$URL$'];

            return glance
                .then(() => urlChangingHooks.reduce((p1, hook) => p1.then(()=> hook.call(new Glance(glance), url)), Promise.resolve()))
                .url(url)
                .then(() => urlLoadedHooks.reduce((p1, hook) => p1.then(()=>hook.call(new Glance(glance), url)), Promise.resolve()))
        }

        return glance;
    },

    glanceSet
];

class Cast {
    constructor(options) {
        this.glance = new Glance(options);
        this.urlLoadedHooks = options.urlLoadedHooks || [];
        this.urlChangingHooks = options.urlChangingHooks || [];
        this.endHooks = options.endHooks || [];
    }

    set(state) {
        var states;

        if (Array.isArray(state))
            states = state;
        else
            states = [state];


        return states.reduce((p1, state)=> p1.then(() => this.eachSetStrategy(state, this.urlLoadedHooks, this.urlChangingHooks, this.glance)), Promise.resolve())
            .then(()=> {
                return this.endHooks.reduce((p1, hook) => p1.then(()=>hook.call(new Glance(this.glance))), Promise.resolve())
            });
    }

    get() {

    }

    eachSetStrategy(state, urlLoadedHooks, urlChangingHooks, glance) {
        return setStrategies.reduce((p1, setStrategy)=> p1.then(()=> setStrategy(state, urlLoadedHooks, urlChangingHooks, glance)), Promise.resolve());
    }
}

export default Cast;