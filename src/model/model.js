const DatabaseConnector = require('../config/database-connector');
const Query = require('./query');
const Q = require('q');

let privateData = new WeakMap();

function getModel(context) {
    return privateData.get(context).model;
}

class Model {

    constructor(collectionName) {
        privateData.set(this, {});
        privateData.get(this).collectionName = collectionName;
        privateData.get(this).model = DatabaseConnector.getInstance().getConnection().model(collectionName);
    }

    getName() {
        return privateData.get(this).collectionName;
    }

    getDefinition() {
        return privateData.get(this).model.definition;
    }

    getSessionUser() {
        /*
         * To be over written in ModelSession class.
         */
        return null;
    }

    getInterceptor() {
        let that = this;
        /*
         * To be over written in ModelSession class.
         */
        return {
            intercept: function (operation, when, docs) {
                let dfd = Q.defer();
                dfd.resolve(docs);
                return dfd.promise;
            }
        };
    }


    _populateReferenceFields(query, options) {
        if (!this.skipPopulate) {
            let def = this.getDefinition();
            def.fields.forEach(function (field) {
                if (field.type === 'reference' && field.ref) {
                    query = query.populate({path: field.name});
                }
            });
        }
        return query;
    }

    skipPopulation() {
        this.skipPopulate = true;
        return this;
    }

    /**
     * @param {Array|Object} docs Documents to insert, as a spread or array
     * @param {Object} [options] Options passed down to `save()`. To specify `options`, `docs` **must** be an array, not a spread.
     * @return {Promise}
     */
    create(docs, options) {
        let that = this;
        let user = this.getSessionUser();
        if (user) {
            if (Array.isArray(docs))
                docs.forEach(function (doc) {
                    doc.created_by = user.id;
                    doc.updated_by = user.id;
                });
            else {
                docs.created_by = user.id;
                docs.updated_by = user.id;
            }
        }
        let dfd = Q.defer();
        that.getInterceptor().intercept('create', 'before', docs).then(function (docs) {
            getModel(that).create(docs, options).then(function (docs) {
                let args = arguments;
                that.getInterceptor().intercept('create', 'after', docs).then(function () {
                    dfd.resolve.apply(null, args);
                }).catch(function (err) {
                    dfd.reject(err);
                });
            }).catch(function (err) {
                dfd.reject(err);
            });
        }).catch(function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    /**
     * @param {Object} [conditions]
     * @param {Object|String} [projection] optional fields to return
     * @param {Object} [options] optional
     * @return {Query}
     */
    find(conditions, projection, options) {
        let mongooseQuery = getModel(this).find(conditions, projection, options);
        let query = new Query(mongooseQuery);
        query = this._populateReferenceFields(query, options);
        return query;
    }

    /**
     * @param {Object|String|Number} id value of `_id` to query by
     * @param {Object|String} [projection] optional fields to return
     * @param {Object} [options] optional
     * @return {Query}
     */
    findById(id, projection, options) {
        if (typeof id === 'undefined') {
            id = null;
        }
        return this.findOne({
            _id: id
        }, projection, options);
    }

    /**
     * @param {Object} [conditions]
     * @param {Object|String} [projection] optional fields to return
     * @param {Object} [options] optional
     * @return {Query}
     */
    findOne(conditions, projection, options) {
        let mongooseQuery = getModel(this).findOne(conditions, projection, options);
        let query = new Query(mongooseQuery);
        query = this._populateReferenceFields(query, options);
        return query;
    }


    findOneAndUpdate(conditions, update, options) {
        let mongooseQuery = getModel(this).findOneAndUpdate(conditions, update, options);
        let query = new Query(mongooseQuery);
        query = this._populateReferenceFields(query, options);
        return query;
    }

    upsert(conditions, update) {
        return this.findOneAndUpdate(conditions, update, {upsert: true, new: true});
    }

    /**
     * @param {Object} conditions
     * @return {Query}
     */
    remove(conditions) {
        let mongooseQuery = getModel(this).remove(conditions);
        return new Query(mongooseQuery);
    }

    /**
     * @param id
     * @returns {Query}
     */
    removeById(id) {
        return this.remove({_id: id});
    }

    /**
     * @param {Object} conditions
     * @param {Object} doc
     * @param {Object} [options] optional see [`Query.prototype.setOptions()`](http://mongoosejs.com/docs/api.html#query_Query-setOptions)
     * @return {Query}
     */
    update(conditions, doc, options) {
        let user = this.getSessionUser();
        if (user) {
            delete doc.created_by;
            doc.updated_by = user.id;
        }
        let mongooseQuery = getModel(this).update(conditions, doc, options);
        return new Query(mongooseQuery);
    }

}

module.exports = Model;
