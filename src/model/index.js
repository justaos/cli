const Q = require('q');
const jsonToSchemaConverter = require('./json-to-schema-converter');
const logger = require('../config/logger');
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

  /**
   * START - mongoose methods wrapping
   */
  findById(id) {
    return privateData.get(this).model.findById(id);
  }

  find(obj) {
    return privateData.get(this).model.find(obj);
  }

  create(obj) {
    return privateData.get(this).model.create(obj);
  }

  remove(condition){
    return privateData.get(this).model.remove(condition).exec();
  }

  removeById(id){
    let condition = {_id: mongoose.Types.ObjectId(id)};
    return this.remove(condition);
  }

  findOneAndUpdate(condition, obj) {
    return privateData.get(this).
        model.
        findOneAndUpdate(condition, obj, {upsert: true}).
        exec();
  }

  findByIdAndUpdate(id, obj) {
    let condition = {_id: mongoose.Types.ObjectId(id)};
    return this.findOneAndUpdate(condition, obj);
  }

  upsert(values, condition) {
    return model.findOne({where: condition}).then(function(obj) {
      if (obj) // update
        return obj.update(values);
      else  // insert
        return model.create(values);
    });
  }

  update(condition, obj) {
    return privateData.get(this).model.update(condition, obj).exec();
  }

  findOne(obj) {
    return privateData.get(this).model.findOne(obj).exec();
  }

  where(obj) {
    return privateData.get(this).model.where(obj);
  }

  /**
   * END - mongoose methods wrapping
   */

  getName() {
    return privateData.get(this).modelName;
  }

  static loadSchemasIntoStore(defs) {
    let conn = database.getConnection();
    let backlog = {};
    let loadSchemaFn = loadSchemaFactory(conn, backlog);
    defs.forEach(loadSchemaFn);
  }

  static loadSchemasFromDB() {
    let dfd = Q.defer();
    let conn = database.getConnection();
    let backlog = {};
    let loadSchemaFn = loadSchemaFactory(conn, backlog);
    let p_collection = new Model('p_collection');
    let p_field = new Model('p_field');
    p_collection.find({}).then(function(collections) {
      if (collections.length) {
        let promises = [];
        collections.forEach(function(collection) {

          let collectionDef = {
            'name': collection.name,
            'label': collection.label,
            'fields': []
          };
          let fieldDfd = Q.defer();
          p_field.find({table: collection.id}).then(function(fields) {
            fields.forEach(function(field) {
              collectionDef.fields.push({
                name: field.name,
                type: field.type
              });
            });
            loadSchemaFn(collectionDef);
            fieldDfd.resolve();
          });
          promises.push(fieldDfd.promise);

        });
        Q.all(promises).then(function() {
          dfd.resolve();
        });
      }
      else
        dfd.resolve();
    });
    return dfd.promise;
  }

  static setDatabase(db) {
    database = db;
  }

  static getDatabase() {
    return database;
  }
}

function loadSchemaFactory(conn, backlog) {
  return function loadSchema(def) {
    let schema = jsonToSchemaConverter(def);
    logger.info('model', 'loading : ' + def.name);
    if (!def.extends) {
      if (!conn.models[def.name]) {
        conn.model(def.name, schema, def.name);
      } else {
        logger.info('Model already loaded : ' + def.name);
      }
    }
    else {
      let extendsModel = conn.models[def.extends];
      if (extendsModel) {
        conn.model(def.extends).discriminator(def.name, schema);
      } else {
        if (!backlog[def.extends]) {
          backlog[def.extends] = [];
        }
        backlog[def.extends].push(def);
      }
    }

    if (backlog[def.name]) {
      backlog[def.name].forEach(function(def) {
        loadSchema(def);
      });
      delete backlog[def.name];
    }
  };
}

module.exports = Model;