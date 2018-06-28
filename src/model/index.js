const mongoose = require('mongoose');

let database;

module.exports = function(loggedInUser, db) {

  if (db)
    database = db;

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

    static getDatabase() {
      return database;
    }

    /**
     * START - mongoose methods wrapping
     */

    count(conditions) {
      return privateData.get(this).model.count(conditions);
    }

    create(docs) {
      if (loggedInUser) {
        if (docs instanceof Array)
          docs.forEach(function(doc) {
            doc.created_by = loggedInUser.id;
          });
        else
          docs.created_by = loggedInUser.id;
      }
      return privateData.get(this).model.create(docs);
    }

    find(conditions, projection, options) {
      return privateData.get(this).model.find(conditions);
    }

    findById(id) {
      return privateData.get(this).model.findById(id);
    }

    findByIdAndUpdate(id, obj) {
      let condition = {_id: mongoose.Types.ObjectId(id)};
      return this.findOneAndUpdate(condition, obj, !id);
    }

    findOne(obj) {
      return privateData.get(this).model.findOne(obj).exec();
    }

    findOneAndUpdate(condition, obj, create) {
      if (loggedInUser){
        obj.updated_by = loggedInUser.id;
        if(create){
          obj.created_by = loggedInUser.id;
        }
      }
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

  return Model;
};

