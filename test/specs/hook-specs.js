import Cast from "../../src/cast";

let cast;

let options = {
    capabilities: [{
        browserName: 'phantomjs'
    }],
    logLevel: 'silent',
    coloredLogs: true,
    screenshotPath: './errorShots/',
    baseUrl: 'http://localhost',
    waitforTimeout: 5000
};

describe('Hooks', function() {
    this.timeout(5000);

    after(function() {
        cast.end();
    });

    it("should allow hooking before all", function() {
        cast = new Cast(Object.assign({
            beforeAll: [
                function(cast, store) {
                    store.desiredState["$url"] = store.desiredState["$url"].replace("test.html", "before-test.html")
                }
            ]

        }, options));

        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/test.html"
            })
            .then(function() {
                return cast.glance.webdriverio.getTitle().should.eventually.equal("Test")
            })
    });

    it("should chain before all hooks", function() {
        cast = new Cast(Object.assign({
            beforeAll: [
                function(cast, store) {
                    store.desiredState["$url"] = store.desiredState["$url"] + "before";
                },
                function(cast, store) {
                    store.desiredState["$url"] = store.desiredState["$url"] + "-test";
                },
                function(cast, store) {
                    store.desiredState["$url"] = store.desiredState["$url"] + ".html";
                }
            ]

        }, options));

        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/"
            })
            .then(function() {
                return cast.glance.webdriverio.getTitle().should.eventually.equal("Test")
            })
    });

    it("should allow hooking after all", function() {
        cast = new Cast(Object.assign({
            afterAll: [
                function(cast, store) {
                    store.currentState = {"foo": "bar"};
                    return store;
                }
            ]

        }, options));

        return cast.apply({})
            .then(function(states) {
                return states.should.deep.equal({
                    "foo": "bar"
                })
            })
    });

    it("should chain after hooks", function() {
        cast = new Cast(Object.assign({
            afterAll: [
                function(cast, store) {
                    store.currentState = {"foo": "bar"};
                },
                function(cast, store) {
                    store.currentState.abc = "123";
                },
                function(cast, store) {
                    store.currentState.another = "one";
                }
            ]

        }, options));

        return cast.apply({})
            .then(function(states) {
                return states.should.deep.equal({
                    "foo": "bar",
                    "abc": "123",
                    "another": "one"
                })
            })
    });
});