const mongoose = require('mongoose');
const Q = require('q');
const logger = require('../config/logger');

function businessRuleAfterExection(docs) {

}

class Query {

    constructor(mongooseQuery) {
        this.query = mongooseQuery || new mongoose.Query();
    }

    exec(cb) {
        if (cb)
            this.query.exec(function (err, docs) {
                businessRuleAfterExection(docs);
                if (err)
                    logger.error(err);
                cb(err, docs);
            });
        else {
            let dfd = Q.defer();
            this.query.exec().then(function (docs) {
                businessRuleAfterExection(docs);
                dfd.resolve(docs);
            }).catch(function (err) {
                dfd.reject(err);
            });
            return dfd.promise;
        }
    }

    populate() {
        this.query = this.query.populate.apply(this.query, arguments);
        return this;
    }

    remove(filter) {
        this.query = this.query.remove(filter);
        return this;
    }

}

module.exports = Query;
