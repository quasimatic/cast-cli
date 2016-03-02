import Glance from "glance-webdriver";

function trySet(cast, key, state, context) {
    var glance = cast.glance;

    var fullKey = key;
    if (context.parentContainerSelector && context.parentContainerSelector != "")
        fullKey = context.parentContainerSelector + ">" + key;

    return glance.set(fullKey, state[key]).then(() => {
        return cast.setAfterHooks.reduce((p1, p2) => p1.then(()=> p2(cast, key, state[key])), Promise.resolve());
    });
}

function glanceSet(state, cast, context) {
    let urlLoadedHooks = cast.urlLoadedHooks;
    let urlChangingHooks = cast.urlChangingHooks;
    let glance = cast.glance;

    return Object.keys(state).reduce((p1, key) => p1.then(()=> {
        var parentSelector = key;

        if (context && context.parentContainerSelector && context.parentContainerSelector != "")
            parentSelector = context.parentContainerSelector + ">" + key

        var newContext = {key: key, parentContainerSelector: parentSelector};

        if (typeof(state[key]) == "object") {
            return glanceSet(state[key], cast, newContext);
        }
        else {
            return trySet(cast, key, state, newContext)
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