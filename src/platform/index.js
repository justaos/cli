'use strict';
const DatabaseConnector = require('../config/database-connector');

const Q = require('q');
const logger = require('../config/logger');
const config = require('../config/config');
const mongoose = require('mongoose');

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
      dfd.resolve(db);
    }, dfd.reject);
    return dfd.promise;
  }

  boot() {
    let that = this;
    let collectionDef = fileUtils.readJsonFilesFromPathSync(P_COLLECTION_PATH);
    let fieldDef = fileUtils.readJsonFilesFromPathSync(P_FIELD_PATH);
    Model.loadSchemasIntoStore(collectionDef);
    Model.loadSchemasIntoStore(fieldDef);
    Model.loadSchemasFromDB().then(function() {
      that.loadData(config.root + '/resources/platform/updates/**.json');
      platformRoutes(that);
      let p_user = new Model('p_user');
      p_user.where({
        username: 'admin'
      }).count(function(err, count) {
        if (!count)
          p_user.create({
            username: 'admin',
            password: hashUtils.generateHash('admin')
          });
      });
      that.scanApplications();
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
        model.findByIdAndUpdate(data.record.id, data.record);
      else if (data.records)
        data.records.forEach(function(record) {
          model.findByIdAndUpdate(record.id, record);
        });
    });
  }

  scanApplications() {
    logger.info('Scanning for apps');
    glob.sync(config.cwd + '/apps/**/config.json').forEach(function(file) {
      let config = fileUtils.readJsonFileSync(file);
      new Model('p_application').findOneAndUpdate({package: config.package},
          config);
    });
  }

  installApplication(appId) {
    let that = this;
    let dfd = Q.defer();
    logger.info('STARTED INSTALLING');
    new Model('p_application').
        findById(appId).
        then(function(application) {
          let modelDef = fileUtils.readJsonFilesFromPathSync(config.cwd +
              '/apps/' + application.package + '/models/**.json');
          Model.loadSchemasIntoStore(modelDef);
          that.loadData(config.cwd + '/apps/' + application.package +
              '/updates/**.json');
          let promises = [];
          modelDef.forEach((model) => {
            promises.push(that.populateSysData(model));
          });
          application.installed_version = application.version;
          promises.push(application.save());
          Q.all(promises).then(function() {
            dfd.resolve();
          });
        });
    return dfd.promise;
  }

  cleanInstall() {
    return cleanInstall(this, PLATFORM_MODELS_PATH);
  }

}

module.exports = Platform;