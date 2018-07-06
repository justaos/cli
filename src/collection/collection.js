const mongoose = require('mongoose');

const DatabaseConnector = require('../config/database-connector');

module.exports = function(loggedInUser) {

    let privateData = new WeakMap();


    function getModel(context) {
        return privateData.get(context).model;
    }

    class Collection {

        constructor(collectionName) {
            privateData.set(this, {});
            privateData.get(this).collectionName = collectionName;
            privateData.get(this).model = DatabaseConnector.getInstance().getConnection().model(collectionName);
        }

        getName() {
            return privateData.get(this).modelName;
        }

        /**
         * @param {Object|String|Number} id value of `_id` to query by
         * @param {Object|String} [projection] optional fields to return, see [`Query.prototype.select()`](#query_Query-select)
         * @param {Object} [options] optional see [`Query.prototype.setOptions()`](http://mongoosejs.com/docs/api.html#query_Query-setOptions)
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
         * @param {Object|String|Number} id value of `_id` to query by
         * @param {Object|String} [projection] optional fields to return, see [`Query.prototype.select()`](#query_Query-select)
         * @param {Object} [options] optional see [`Query.prototype.setOptions()`](http://mongoosejs.com/docs/api.html#query_Query-setOptions)
         * @return {Query}
         */
        findOne(id, projection, options) {
            if (typeof id === 'undefined') {
                id = null;
            }
            return this.model.findOne({
                _id: id
            }, projection, options);
        }



    }

    return Collection;
};
