import Glance from "@quasimatic/glance";
import GlanceConverter from "./converters/glance-converter";
import "./promise-array";

var converters = [GlanceConverter];

function processTargets(cast, state, store, parentTarget) {
    return Object.keys(state).resolveSeries(key => {
        let values = [].concat(state[key]);

        return values.resolveSeries(value => {
            var target = {
                key: key,
                value: state[key],
                context: parentTarget ? parentTarget.context : []
            };

            return converters.firstResolved(Converter => {
                return new Converter().process(cast, target, store)
                    .then((evaluatedTarget)=> {
                        if (!evaluatedTarget.processed)
                            return processTargets(cast, value, store, evaluatedTarget)
                    })
            })
        })
    })
}

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
                    .then(()=> processTargets(this, state, store))
                    .then(()=> this.afterAll.resolveSeries(afterAll => afterAll(this, store)))
                    .then(()=> stores.push(store))
            })
            .then(function() {
                if (stores.length == 1) {
                    return stores[0].currentState;
                }
                else {
                    return stores.map(s => s.currentState);
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