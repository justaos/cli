const mongoose = require('mongoose');

const DatabaseConnector = require('../config/database-connector');
const Query = require('./query');

let privateData = new WeakMap();

function getModel(context) {
  return privateData.get(context).model;
}

class Model {

  constructor(collectionName) {
    privateData.set(this, {});
    privateData.get(this).collectionName = collectionName;
    privateData.get(this).model = DatabaseConnector.getInstance().
        getConnection().
        model(collectionName);
  }

  getName() {
    return privateData.get(this).modelName;
  }

  getSessionUser(){
    /*
     * To be over written in ModelSession class.
     */
    return null;
  }

  /**
   * @param {Object} [conditions]
   * @param {Object|String} [projection] optional fields to return
   * @param {Object} [options] optional
   * @return {Query}
   */
  find(conditions, projection, options) {
    let mongooseQuery = getModel(this).find(conditions, projection, options);
    return new Query(mongooseQuery);
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
    return new Query(mongooseQuery);
  }

}

module.exports = Model;
