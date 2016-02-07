import Glance from "glance-webdriver";

function trySet(glance, key, state, parentKeys) {
    var parents = parentKeys.slice();

  //  return new Promise(function(resolve, reject) {
    //    console.log("trySet", key, state[key])
        return glance.set(key, state[key]).then(()=>{
            console.log("Resolved")
            return Promise.resolve();
        }).catch(()=> {
            console.log("Error")
            let parent = parents.shift();
            console.log(parent)
            if (parent)
                return trySet(glance, parent + ">key", state, parents)
            else
                return Promise.reject();

        });
    //})
}

function glanceSet(state, urlHooks, glance, parentKeys) {
    parentKeys = parentKeys || [];
    console.log("GlanceSet", state)

    return Object.keys(state).reduce((p1, key) => p1.then(()=> {
        if (typeof(state[key]) == "object") {
            console.log(key, ": Object")
            parentKeys.unshift(key)
            return glanceSet(state[key], urlHooks, glance, parentKeys);
        }
        else {
            return trySet(glance, key, state, parentKeys)
        }
    }), Promise.resolve());
}

var setStrategies = [
    function url(state, urlHooks, glance) {
        var url = state['$URL$'];
        if (url) {
            delete state['$URL$'];
            return new Promise((resolve, reject) => {
                glance.url(url).then(() => urlHooks.reduce((p1, hook) => p1.then(()=>hook(url, glance)), Promise.resolve()).then(resolve))
            });
        }

        return glance;
    },

    glanceSet
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

        return states.reduce((p1, state)=> p1.then(() => this.eachSetStrategy(state, this.urlHooks, glance)), Promise.resolve())
    }

    get() {

    }

    eachSetStrategy(state, urlHooks, glance) {
        return setStrategies.reduce((p1, setStrategy)=> p1.then(()=> setStrategy(state, urlHooks, glance)), Promise.resolve());
    }
}

export default Cast;