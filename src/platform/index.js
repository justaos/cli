'use strict';
const DatabaseConnector = require('../config/database-connector');

const Q = require('q');
const logger = require('../config/logger');
const config = require('../config/config');

const stringUtils = require('../utils/string-utils');
const fileUtils = require('../utils/file-utils');
const hashUtils = require('../utils/hash-utils');
const cleanInstall = require('./cleanInstall');
const Model = require('../model');
const glob = require('glob');
const platformRoutes = require('./platform-routes');

let PLATFORM_MODELS_PATH = config.root + '/resources/platform/models/**.json';
let P_COLLECTION_PATH = config.root +
    '/resources/platform/models/p_collection.json';
let P_FIELD_PATH = config.root + '/resources/platform/models/p_field.json';

class Platform {

  constructor(router) {
    this.router = router;
  }

  initialize() {
    let dfd = Q.defer();
    const db = new DatabaseConnector();
    db.connect().then(function() {
      Model.setDatabase(db);
      dfd.resolve();
    }, dfd.reject);
    return dfd.promise;
  }

  boot() {
    let collectionDef = fileUtils.readJsonFilesFromPathSync(P_COLLECTION_PATH);
    let fieldDef = fileUtils.readJsonFilesFromPathSync(P_FIELD_PATH);
    Model.loadSchemasIntoStore(collectionDef);
    Model.loadSchemasIntoStore(fieldDef);
    Model.loadSchemasFromDB();
    this.loadData(config.root + '/resources/platform/update/**.json');
    platformRoutes(this);
    let p_user = new Model('p_user');
    p_user.where({
      username: 'admin'
    }).count(function (err, count) {
      if (!count)
        p_user.create({
          username: 'admin',
          password: hashUtils.generateHash('admin')
        });
    });
  }

  populateSysData(collectionDef) {
    let that = this;
    let dfd = Q.defer();
    let p_collection = new Model('p_collection');
    let p_field = new Model('p_field');
    p_collection.create({
      name: collectionDef.name,
      label: collectionDef.label
    }).then(function(tableRecord) {
      let promises = [];
      collectionDef.fields.forEach(function(field) {
        promises.push(p_field.create({
          name: field.name,
          label: field.label ?
              field.label :
              stringUtils.underscoreToCamelCase(field.name),
          type: field.type,
          table: tableRecord.id
        }));
      });
      Q.all(promises).then(function() {
        dfd.resolve();
      });
    });
    return dfd.promise;
  }

  loadData(path) {
    glob.sync(path).forEach(function(file) {
      let data = fileUtils.readJsonFileSync(file);
      let model = new Model(data.collection);
      if (data.record)
        model.upsert(data.record);
      else if (data.records)
        data.records.forEach(function(record) {
          model.upsert(record);
        });
    });
  }

  cleanInstall() {
    return cleanInstall(this, PLATFORM_MODELS_PATH);
  }

}

module.exports = Platform;