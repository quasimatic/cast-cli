import Glance from "@quasimatic/glance";
import './promise-array';

function trySet(cast, key, value, store) {
    var glance = cast.glance;

    var fullKey = key;

    if (store.context.length > 0)
        fullKey = store.context.join(">") + ">" + key;

    return glance.set(fullKey, value)
        .then(() => cast.setAfterHooks.resolveSeries(hook => hook(cast, key, value)));
}

function glanceSet(cast, state, store, target) {
    return Object.keys(state).resolveSeries(key => {
        let values = [].concat(state[key]);

        return values.resolveSeries(value => {
            var newTarget = {
                key: key,
                value: state[key],
                context: target ? target.context : []
            };

            if (typeof(value) == "object") {
                newTarget.context.push(key);
                return glanceSet(cast, value, store, newTarget);
            }
            else {
                return trySet(cast, key, value, newTarget)
            }
        })
    })
}

var setStrategies = [
    glanceSet
];

class Cast {
    constructor(options) {
        this.glance = new Glance(options);

        this.beforeAll = options.beforeAll || [];
        this.afterAll = options.afterAll || [];

        this.setAfterHooks = options.setAfterHooks || [];
        this.literals = options.literals || [];
    }

    apply(state) {
        var stores = [];
        var states = [].concat(state);

        return states.resolveSeries((state) => {
                let store = {
                    desiredState: state,
                    currentState: {}
                };

                return this.beforeAll.resolveSeries(beforeAll => beforeAll(this, store))
                    .then(()=> setStrategies.resolveSeries(targetStrategy => targetStrategy(this, state, store)))
                    .then(()=> this.afterAll.resolveSeries(afterAll => afterAll(this, store)))
                    .then(()=> stores.push(store))
            })
            .then(function() {
                if (stores.length == 1) {
                    return stores[0].currentState;
                }
                else {
                    return stores.map(c => c.currentState);
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