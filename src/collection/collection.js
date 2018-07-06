const mongoose = require('mongoose');

const DatabaseConnector = require('../config/database-connector');
const Query = require('./query');

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
            if (typeof id === 'undefined') {
                id = null;
            }
            
            var mongooseQuery = this.model.findOne(conditions, projection, options);
            
            return new Query(mongooseQuery);
        }

    }

    return Collection;
};
