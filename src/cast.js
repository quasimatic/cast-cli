import Glance from "@quasimatic/glance";
import './promise-array';

function trySet(cast, key, value, context) {
    var glance = cast.glance;

    var fullKey = key;
    if (context.containerSelector && context.containerSelector != "")
        fullKey = context.containerSelector + ">" + key;

    return glance.set(fullKey, value)
        .then(() => cast.setAfterHooks.resolveSeries(hook => hook(cast, key, value)));
}

function glanceSet(cast, state, context, OLDCONTEXT) {
    let glance = cast.glance;

    return Object.keys(state).resolveSeries(key => {
        if (cast.literals[key]) {
            return Promise.resolve(cast.literals[key](this, key, context[key], OLDCONTEXT));
        }
        else {
            let values = state[key];
            if (!Array.isArray(values)) {
                values = [values]
            }

            return values.resolveSeries(value => {
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
            })
        }
    })
}

var setStrategies = [glanceSet];

class Cast {
    constructor(options) {
        this.glance = new Glance(options);

        this.beforeAll = options.beforeAll || [];
        this.afterAll = options.afterAll || [];

        this.setAfterHooks = options.setAfterHooks || [];
        this.literals = options.literals || [];
    }

    apply(state) {
        var states = [].concat(state);

        var contexts = [];

        return states.resolveSeries((state) => {
                let context = {
                    desiredState: state,
                    currentState: {}
                };

                return this.beforeAll.resolveSeries(hook => hook(this, context))
                    .then(()=> setStrategies.resolveSeries((hook)=> hook(this, state, context)))
                    .then(()=> this.afterAll.resolveSeries((hook)=> hook(this, context)))
                    .then(()=> contexts.push(context))
            })
            .then(function() {
                if (contexts.length == 1) {
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
}

export default Cast;