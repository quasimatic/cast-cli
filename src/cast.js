import Glance from "glance-webdriver";

function trySet(cast, key, state, remainingKeys, parentStack) {
    var glance = cast.glance;

    parentStack = parentStack || [];
    var parents = remainingKeys.slice();
    var fullKey = key;
    if (parentStack.length > 0)
        fullKey = parentStack.join(">") + ">" + key

    return new Promise((resolve, reject)=> {
        glance.set(fullKey, state[key]).then(() => {
                return cast.setAfterHooks.reduce((p1, p2) => p1.then(()=> p2(cast, key, state[key])), Promise.resolve()).then(resolve, reject);
            },
            (reason)=> {
                var parent = parents.shift();
                if (parent) {
                    parentStack.push(parent);
                    return resolve(trySet(cast, key, state, parents, parentStack))
                }

                return reject(reason);
            });
    });
}

function glanceSet(state, cast, parentKeys) {
    let urlLoadedHooks = cast.urlLoadedHooks;
    let urlChangingHooks = cast.urlChangingHooks;
    let glance = cast.glance;

    parentKeys = parentKeys || [];

    return Object.keys(state).reduce((p1, key) => p1.then(()=> {
        if (typeof(state[key]) == "object") {
            parentKeys.unshift(key)
            return glanceSet(state[key], cast, parentKeys);
        }
        else {
            return trySet(cast, key, state, parentKeys)
        }
    }), Promise.resolve())
}

var setStrategies = [
    function url(state) {
        let urlLoadedHooks = cast.urlLoadedHooks;
        let urlChangingHooks = cast.urlChangingHooks;
        let glance = cast.glance;

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
        this.setAfterHooks = options.setAfterHooks || [];
    }

    set(state) {
        var states;

        if (Array.isArray(state))
            states = state;
        else
            states = [state];


        return states.reduce((p1, state)=> p1.then(() => this._eachSetStrategy(state, this)), Promise.resolve())
            .then(()=> {
                return this.endHooks.reduce((p1, hook) => p1.then(()=>hook.call(new Glance(this.glance))), Promise.resolve())
            });
    }

    get() {

    }

    addSetAfterHook(func) {
        this.setAfterHooks.push(func);
    }

    _eachSetStrategy(state, urlLoadedHooks, urlChangingHooks, glance) {
        return setStrategies.reduce((p1, setStrategy)=> p1.then(()=> setStrategy(state, urlLoadedHooks, urlChangingHooks, glance)), Promise.resolve());
    }
}

export default Cast;