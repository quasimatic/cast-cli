import Glance from "@quasimatic/glance";

function trySet(cast, key, value, context) {
    var glance = cast.glance;

    var fullKey = key;
    if (context.containerSelector && context.containerSelector != "")
        fullKey = context.containerSelector + ">" + key;

    return glance.set(fullKey, value).then(() => {
        return cast.setAfterHooks.reduce((p1, p2) => p1.then(()=> p2(cast, key, value)), Promise.resolve());
    });
}

function glanceSet(cast, state, context, OLDCONTEXT) {
    let glance = cast.glance;

    return Object.keys(state).reduce((p1, key) => p1.then(()=> {
        if (cast.literals[key]) {
            return Promise.resolve(cast.literals[key](this, key, context[key], OLDCONTEXT));
        }
        else {
            let values = state[key];
            if (!Array.isArray(values)) {
                values = [values]
            }

            return values.reduce((setP, value)=> setP.then(()=> {
                    var newContext = {key: key};

                    if (OLDCONTEXT && OLDCONTEXT.containerSelector && OLDCONTEXT.containerSelector != "")
                        newContext.containerSelector = OLDCONTEXT.containerSelector + ">" + key

                    if (typeof(value) == "object") {
                        if (!newContext.containerSelector)
                            newContext.containerSelector = key;

                        return glanceSet(cast, value, context, newContext);
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
        this.afterAll = options.afterAll || [];

        this.literals = options.literals || {};


        this.setAfterHooks = options.setAfterHooks || [];
    }

    apply(state) {
        var states;

        if (Array.isArray(state))
            states = state;
        else
            states = [state];

        var contexts = [];

        return states.reduce((p1, state)=> p1.then(() => {
                let context = {
                    desiredState: state,
                    currentState: {}
                };

                return this.beforeAll.reduce((p1, beforeAllHook)=> p1.then(() => beforeAllHook(this, context)), Promise.resolve())
                    .then(()=> this._eachSetStrategy(this, state, context))
                    .then(()=> {
                        return this.afterAll.reduce((p1, afterAllHook) => p1.then(()=> {
                            context = afterAllHook(this, context)
                        }), Promise.resolve())
                    })
                    .then(()=> contexts.push(context))
            }), Promise.resolve())
            .then(function() {
                if(contexts.length == 1) {
                    return contexts[0].currentState;
                }
                else {
                    return contexts.map(c => c.currentState);
                }
            })
    }

    end() {
        return this.glance.webdriverio.end();
    }

    addSetAfterHook(func) {
        this.setAfterHooks.push(func);
    }

    _eachSetStrategy(context, state, cast) {
        return setStrategies.reduce((p1, setStrategy)=> p1.then(()=> setStrategy(context, state, cast)), Promise.resolve());
    }
}

export default Cast;