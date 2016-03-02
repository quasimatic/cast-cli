describe('Cast', function() {
    it("should go to url", function*() {
        yield cast.set({
            "$URL$": "file:///" + __dirname + "/examples/page1.html"
        });

        (yield cast.glance.get("$TITLE$")).should.equal("Page 1")
    });

    it("should set value", function*() {
        yield cast.set({
            "$URL$": "file:///" + __dirname + "/examples/page1.html",
            "text-1": "Data 1"
        });

        (yield cast.glance.get("text-1")).should.equal("Data 1")
    });

    it("should set multiple values", function*() {
        yield cast.set({
            "$URL$": "file:///" + __dirname + "/examples/page1.html",
            "text-1": "Data 1",
            "text-2": "Data 2"
        });

        var text = yield cast.glance.get("text-1")
        text.should.equal("Data 1")

        var text = yield cast.glance.get("text-2")
        text.should.equal("Data 2")
    });

    it("should support url hooks", function*() {
        this.timeout(30000);
        yield cast.set({"$URL$": "file:///" + __dirname + "/examples/url-hook.html"});

        var title = yield cast.glance.get("$TITLE$");
        title.should.equal("Title Changed");
    });

    it("should support nested keys as a glance container", function*() {
        this.timeout(30000);
        yield cast.set({
            "$URL$": "file:///" + __dirname + "/examples/custom-key.html",
            "wrapper-1": {
                "text-1": "Data 1",
                "text-2": "Data 2"
            }
        })

        var text = yield cast.glance.get("wrapper-1>text-1")
        text.should.equal("Data 1")

        var text = yield cast.glance.get("wrapper-1>text-2")
        text.should.equal("Data 2")
    });

    it("should go to multiple urls and set value", function*() {
        yield cast.glance.url("file:///" + __dirname + "/examples/page1.html").execute(function() {
            localStorage.clear()
        });

        yield cast.set([
            {
                "$URL$": "file:///" + __dirname + "/examples/page1.html",
                "text-1": "Data 1"
            },
            {
                "$URL$": "file:///" + __dirname + "/examples/page2.html",
                "text-1": "Data 2"
            }
        ]);

        yield cast.glance.url("file:///" + __dirname + "/examples/page1.html");
        var text = yield cast.glance.get("text-1");
        text.should.equal("Data 1");

        yield cast.glance.url("file:///" + __dirname + "/examples/page2.html");
        var text = yield cast.glance.get("text-1");
        text.should.equal("Data 2");
    });

    it("should have set after hooks", function*(){
        this.timeout(30000);

        cast.addSetAfterHook(function(cast, key, value){
            if(key == "after-hook-text-1") {
                cast.glance.click("button-change");
            }
        });

        yield cast.set([
            {
                "$URL$": "file:///" + __dirname + "/examples/set-hooks.html",
                "after-hook-text-1": "Data"
            }
        ]);

        var text = yield cast.glance.get("text-1")
        text.should.equal("Data saved")
    })
});