import Cast from '../../src/cast'

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

let expect = chai.expect;
chai.Should();

let cast;
let glance;

describe('Cast', function() {
    this.timeout(5000);

    before(function() {
        cast = new Cast({
            capabilities: [{
                browserName: 'phantomjs'
            }],
            logLevel: 'silent',
            coloredLogs: true,
            screenshotPath: './errorShots/',
            baseUrl: 'http://localhost',
            waitforTimeout: 5000,
            setAfterHooks: [
                function(cast, key, value) {
                    return cast.glance.webdriverio.getTitle().then(function(title) {
                        if (title == "Title needs to change") {
                            return cast.glance.click("Change Title");
                        }
                    });
                },

                function(cast, key, value) {
                    if (key == "text-1") {
                        return cast.glance.click("button-save").catch(function(err) {
                            return Promise.resolve();
                        });
                    }
                }
            ]
        });

        glance = cast.glance;
    })

    it("should go to url", function() {
        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/page1.html"
            })
            .then(function() {
                return Promise.resolve();
                return cast.glance.get("$PAGE$:title").should.eventually.equal("Page 1")
            })
    })

    it("should set value", function() {
        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/page1.html",
                "text-1": "Data 1"
            })
            .then(function() {
                return cast.glance.get("text-1").should.eventually.equal("Data 1")
            })
    });

    it("should set multiple values", function() {
        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/page1.html",
                "text-1": "Data 1",
                "text-2": "Data 2"
            })
            .then(function() {
                return cast.glance.get("text-1").should.eventually.equal("Data 1")
            })

            .then(function() {
                return cast.glance.get("text-2").should.eventually.equal("Data 2")
            })
    });

    it("should support url hooks", function() {
        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/url-hook.html"
            })
            .then(function() {
                return cast.glance.webdriverio.getTitle().should.eventually.equal("Title Changed");
            })
    });

    it("should support nested keys as a glance container", function() {
        return cast.apply({
                "$url": "file:///" + __dirname + "/examples/custom-key.html",
                "wrapper-1": {
                    "text-1": "Data 1",
                    "text-2": "Data 2"
                }
            })
            .then(function() {
                return cast.glance.get("wrapper-1>text-1").should.eventually.equal("Data 1")
            })
            .then(function() {
                return cast.glance.get("wrapper-1>text-2").should.eventually.equal("Data 2")
            })
    });

    it("should go to multiple urls and set value", function() {
        return cast.glance.url("file:///" + __dirname + "/examples/page1.html")
            .execute(function() {
                localStorage.clear()
            })
            .then(function() {
                return cast.apply([
                    {
                        "$url": "file:///" + __dirname + "/examples/page1.html",
                        "text-1": "Data 1"
                    },
                    {
                        "$url": "file:///" + __dirname + "/examples/page2.html",
                        "text-1": "Data 2"
                    }
                ]);
            })
            .then(function() {
                return cast.glance.url("file:///" + __dirname + "/examples/page1.html")
                    .get("text-1").should.eventually.equal("Data 1");
            })

            .then(function() {
                return cast.glance.url("file:///" + __dirname + "/examples/page2.html")
                    .get("text-1").should.eventually.equal("Data 2");
            })
    });

    it("should have set after hooks", function() {
        cast.addSetAfterHook(function(cast, key, value) {
            if (key == "after-hook-text-1") {
                return cast.glance.click("button-change");
            }
        });

        return cast.apply([
                {
                    "$url": "file:///" + __dirname + "/examples/set-hooks.html",
                    "after-hook-text-1": "Data"
                }
            ])
            .then(function() {
                return cast.glance.get("text-1").should.eventually.equal("Data saved");
            });
    })
});