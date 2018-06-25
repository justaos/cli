const mongoose = require('mongoose');

let database;

let privateData = new WeakMap();

class Model {

  constructor(modelName) {
    privateData.set(this, {});
    privateData.get(this).modelName = modelName;
    let conn = database.getConnection();
    privateData.get(this).model = conn.model(modelName);
  }

  set(obj) {
    return privateData.get(this).model(obj);
  }
  
  getName() {
    return privateData.get(this).modelName;
  }

  static setDatabase(db) {
    database = db;
  }

  static getDatabase() {
    return database;
  }

  /**
   * START - mongoose methods wrapping
   */
  create(obj) {
    return privateData.get(this).model.create(obj);
  }

  find(conditions, projection, options) {
    return privateData.get(this).model.find(conditions);
  }

  findById(id) {
    return privateData.get(this).model.findById(id);
  }
  
  findByIdAndUpdate(id, obj) {
    let condition = {_id: mongoose.Types.ObjectId(id)};
    return this.findOneAndUpdate(condition, obj);
  }
  
  findOne(obj) {
    return privateData.get(this).model.findOne(obj).exec();
  }
  
  findOneAndUpdate(condition, obj) {
    return privateData.get(this).
        model.
        findOneAndUpdate(condition, obj, {upsert: true}).
        exec();
  }

  remove(condition) {
    return privateData.get(this).model.remove(condition).exec();
  }

  removeById(id) {
    let condition = {_id: mongoose.Types.ObjectId(id)};
    return this.remove(condition);
  }

  upsert(values, condition) {
    let that = this;
    return this.findOne({where: condition}).then(function(obj) {
      if (obj) // update
        return obj.update(values);
      else  // insert
        return that.create(values);
    });
  }

  update(condition, obj) {
    return privateData.get(this).model.update(condition, obj).exec();
  }

  where(obj) {
    return privateData.get(this).model.where(obj);
  }

  /**
   * END - mongoose methods wrapping
   */

  
}

module.exports = Model;
