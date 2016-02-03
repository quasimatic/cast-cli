import Glance from "glance-webdriver";

var setStrategies = [
    function url(state, urlHooks, glance) {
        var url = state['$URL$'];
        if (url) {
            delete state['$URL$'];
            return new Promise(function(resolve, reject) {
                glance.url(url).then(() => urlHooks.reduce((p1, hook) => p1.then(()=>hook(url, glance)), Promise.resolve()).then(resolve))
            });
        }

        return glance;
    },

    function glaceSet(state, urlHooks, glance) {
        return Object.keys(state).reduce((p1, key) => p1.then(()=> glance.set(key, state[key])), Promise.resolve());
    }
];

class Cast {
    constructor(options) {
        this.glance = new Glance(options);
        this.urlHooks = options.urlHooks;
    }

    set(state) {
        var states;

        if (Array.isArray(state))
            states = state;
        else
            states = [state];

        return states.reduce((p1, s)=> p1.then(() => this.eachSetStrategy(s, this.urlHooks, glance)), Promise.resolve())
    }

    get() {

    }

    eachSetStrategy(s, urlHooks, glance) {
        return setStrategies.reduce((p1, setStrategy2)=> p1.then(()=> setStrategy2(s, urlHooks, glance)), Promise.resolve());
    }
}

export default Cast;