const mongoose = require('mongoose');

class Query {

    constructor(mongooseQuery) {
        this.query = mongooseQuery || new mongoose.Query();
    }

    exec(cb) {
        return this.query.exec(cb)
    }

    remove(filter) {
        this.query = this.query.remove(filter);
        return this;
    }

}

module.exports = Query;
