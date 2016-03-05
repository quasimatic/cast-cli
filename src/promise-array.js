Array.prototype.resolveSeries = function(func) {
    return this.reduce((p1, next)=> p1.then(() => func(next)), Promise.resolve());
};