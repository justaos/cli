const mongoose = require('mongoose');

class Query {

    constructor(mongooseQuery) {
        this.query = mongooseQuery || new mongoose.Query();
    }

    exec(cb) {
        this.query.exec(cb)
    }

}

module.exports = Query;
