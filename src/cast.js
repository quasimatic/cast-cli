import Glance from "@quasimatic/glance";
import GlanceConverter from "./converters/glance-converter";
import "./promise-array";

var converters = [GlanceConverter];

function getTargetHooks(cast, target) {
    return cast.targetHooks.filter(function(hook) {
        return !hook.labelFilter || target.key == hook.labelFilter;
    })
}

function processTargets(cast, state, store, parentTarget) {
    parentTarget = parentTarget || {
            context: [],
            hooks: []
        };
    return Object.keys(state).resolveSeries(key => {
        let values = [].concat(state[key]);

        return values.resolveSeries(value => {
            var target = {
                key: key,
                value: value,
                context: parentTarget.context
            };

            return converters.firstResolved(converter => {
                return parentTarget.hooks.resolveSeries(hook => hook.beforeEach(cast, target, store))
                    .then(() => {
                        return getTargetHooks(cast, target).resolveSeries(hook => hook.before(cast, target, store))
                    })
                    .then(()=> {
                        if(target.continue) {
                           return target;
                        }
                        else {
                            return converter.process(cast, target, store);
                        }
                    })
                    .then(evaluatedTarget => {
                        let evaluatedTargetHooks = getTargetHooks(cast, evaluatedTarget);
                        return evaluatedTargetHooks.resolveSeries(hook => hook.after(cast, evaluatedTarget, store))
                            .then(()=> {
                                if (!evaluatedTarget.handled) {
                                    evaluatedTarget.hooks = [];

                                    evaluatedTarget.hooks = evaluatedTarget.hooks.concat(parentTarget.hooks)

                                    evaluatedTarget.hooks = evaluatedTarget.hooks.concat(evaluatedTargetHooks);

                                    return processTargets(cast, value, store, evaluatedTarget)
                                }

                                return Promise.resolve(evaluatedTarget);
                            })
                            .then(evaluatedTarget => {
                                return parentTarget.hooks.resolveSeries(hook => hook.afterEach(cast, evaluatedTarget, store))
                            });
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

        this.targetHooks = (options.targetHooks || []).map(function(hook) {
            return Object.assign({
                labelFilter: null,
                before: function() {
                },
                after: function() {
                },
                beforeEach: function() {
                },
                afterEach: function() {
                },
                set: function() {
                },
                get: function() {
                },
                apply: function() {
                }
            }, hook)
        });

        this.targetEnter = options.targetEnter || [];
        this.targetLeave = options.targetLeave || [];

        this.literals = options.literals || [];

        this.logLevel = options.logLevel || "error";
        this.glance.setLogLevel(this.logLevel);
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
}

export default Cast;