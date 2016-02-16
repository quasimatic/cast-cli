import Glance from "glance-webdriver";

function trySet(glance, key, state, remainingKeys, parentStack) {
    parentStack = parentStack || [];
    var parents = remainingKeys.slice();
    var fullKey = key;
    if (parentStack.length > 0)
        fullKey = parentStack.join(">") + ">" + key

    console.log("trySet", key, fullKey, state[key])

    return new Promise((resolve, reject)=> {
        glance.set(fullKey, state[key]).then((value)=> {
                console.log("THEN:", value);
                resolve(value);
            },
            (reason)=> {
                console.log("CATCH:", reason)

                var parent = parents.shift();
                if (parent) {
                    parentStack.push(parent);
                    console.log('here')
                    return trySet(glance, key, state, parents, parentStack).then(resolve, reject)
                    //return Promise.reject();
                }

                reject(reason);
            });

    })


    /*.catch((reason)=> {
     //        console.log("Error:", err)
     var parent = parents.shift();
     if (parent) {
     parentStack.push(parent);
     return trySet(glance, key, state, parents, parentStack)
     }
     else {
     console.log("Throwing error")
     return Promise.reject(reason)
     }
     });*/
}

function glanceSet(state, urlHooks, glance, parentKeys) {
    parentKeys = parentKeys || [];

    return new Promise((resolve, reject)=> {
        Object.keys(state).reduce((p1, key) => p1.then(()=> {
            if (typeof(state[key]) == "object") {
                parentKeys.unshift(key)
                return glanceSet(state[key], urlHooks, glance, parentKeys);
            }
            else {

                return trySet(glance, key, state, parentKeys)
            }
        }), Promise.resolve()).then(resolve, reject);
    })

}

var setStrategies = [
    function url(state, urlHooks, glance) {
        var url = state['$URL$'];
        if (url) {
            delete state['$URL$'];
            return glance.url(url).then(() => urlHooks.reduce((p1, hook) => p1.then(()=>hook.call(new Glance(glance), url)), Promise.resolve()))
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