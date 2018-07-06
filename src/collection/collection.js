const mongoose = require('mongoose');

const DatabaseConnector = require('../config/database-connector');

module.exports = function(loggedInUser) {

  let privateData = new WeakMap();


  function getModel(context){
    return privateData.get(context).model;
  }

  class Collection extends CollectionFind{

    constructor(collectionName) {
      privateData.set(this, {});
      privateData.get(this).collectionName = collectionName;
      privateData.get(this).model = DatabaseConnector.getInstance().getConnection().model(collectionName);
    }

    getName() {
      return privateData.get(this).modelName;
    }

    /**
     * START - mongoose methods wrapping
     */

    count(conditions) {
      return getModel(this).count(conditions);
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
      return privateData.get(this).model.find(conditions, projection, options);
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

  return Collection;
};

