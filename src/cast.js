import Glance from "glance-webdriver";

var setStrategies = [
    function url(state, glance) {
        if (state.url) {
            var url = state.url;
            delete state.url;
            return glance.url(url)
        }

        return glance;
    },
    function glaceSet(state, glance) {
        return Object.keys(state).reduce((p1, key) => p1.then(()=>glance.set(key, state[key])), Promise.resolve());
    }
];

function eachSetStrategy(s) {
    return setStrategies.reduce((p1, setStrategy2)=> p1.then(()=> setStrategy2(s, glance)), Promise.resolve());
}

class Cast {
    constructor(options) {
        this.glance = new Glance(options);
    }

    set(state) {
        var states;

        if (Array.isArray(state))
            states = state;
        else
            states = [state];

        return states.reduce((p1, s)=> p1.then(() => eachSetStrategy(s)), Promise.resolve())
    }

    get() {

    }
}

export default Cast;