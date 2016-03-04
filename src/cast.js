import Glance from "@quasimatic/glance";

function trySet(cast, key, value, context) {
    var glance = cast.glance;

    var fullKey = key;
    if (context.parentContainerSelector && context.parentContainerSelector != "")
        fullKey = context.parentContainerSelector + ">" + key;

    return glance.set(fullKey, value).then(() => {
        return cast.setAfterHooks.reduce((p1, p2) => p1.then(()=> p2(cast, key, value)), Promise.resolve());
    });
}

function glanceSet(state, cast, context) {
    let glance = cast.glance;

    return Object.keys(state).reduce((p1, key) => p1.then(()=> {
        if (cast.literalHooks[key]) {
            return Promise.resolve(cast.literalHooks[key](this, key, state[key], context));
        }
        else {
            let values = state[key];
            if (!Array.isArray(values)) {
                values = [values]
            }

            return values.reduce((setP, value)=> setP.then(()=> {
                    var newContext = {key: key};

                    if (context && context.parentContainerSelector && context.parentContainerSelector != "")
                        newContext.parentContainerSelector = context.parentContainerSelector + ">" + key

                    if (typeof(value) == "object") {
                        if (!newContext.parentContainerSelector)
                            newContext.parentContainerSelector = key;

                        return glanceSet(value, cast, newContext);
                    }
                    else {
                        return trySet(cast, key, value, newContext)
                    }
                }
            ), Promise.resolve());
        }
    }), Promise.resolve())
}

var setStrategies = [
    glanceSet
];

class Cast {
    constructor(options) {
        this.glance = new Glance(options);
        this.beforeAll = options.beforeAll || [];
        this.literalHooks = options.literalHooks || {};
        this.endHooks = options.endHooks || [];
        this.setAfterHooks = options.setAfterHooks || [];
    }

    apply(state) {
        var states;

        if (Array.isArray(state))
            states = state;
        else
            states = [state];

        return this.beforeAll.reduce((p1, func)=> p1.then(() => func(this, state)), Promise.resolve()).then(()=> {
            return states.reduce((p1, state)=> p1.then(() => this._eachSetStrategy(state, this)), Promise.resolve())
                .then(()=> {
                    return this.endHooks.reduce((p1, hook) => p1.then(()=>hook.call(new Glance(this.glance))), Promise.resolve())
                });
        })
    }

    end() {
        return this.glance.webdriverio.end();
    }

    addSetAfterHook(func) {
        this.setAfterHooks.push(func);
    }

    _eachSetStrategy(state, cast) {
        return setStrategies.reduce((p1, setStrategy)=> p1.then(()=> setStrategy(state, cast)), Promise.resolve());
    }
}

export default Cast;