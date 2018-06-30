'use strict';
const DatabaseConnector = require('../config/database-connector');
const express = require('express');
const Q = require('q');
const logger = require('../config/logger');
const config = require('../config/config');

const stringUtils = require('../utils/string-utils');
const fileUtils = require('../utils/file-utils');
const hashUtils = require('../utils/hash-utils');
const cleanInstall = require('./clean-install');
const getModel = require('../model');
const modelUtils = require('../model/model-utils');
const glob = require('glob');
const platformRoutes = require('./platform-routes');

let PLATFORM_MODELS_PATH = config.root + '/resources/platform/models/**.json';
let P_COLLECTION_PATH = config.root +
    '/resources/platform/models/p_collection.json';
let P_FIELD_PATH = config.root + '/resources/platform/models/p_field.json';

let PROD_PATH;
if (config.mode === 'internal')
  PROD_PATH = config.cwd + '/resources/apps/prod/';
else
  PROD_PATH = config.cwd + '/apps/';

let Model;

class Platform {

  constructor(router) {
    this.router = router;
  }

  initialize() {
    let dfd = Q.defer();
    const db = new DatabaseConnector();
    db.connect().then(() => {
      Model = getModel('admin', db);
      dfd.resolve(db);
    }, dfd.reject);
    return dfd.promise;
  }

  boot() {
    let that = this;
    let collectionDef = fileUtils.readJsonFilesFromPathSync(P_COLLECTION_PATH);
    let fieldDef = fileUtils.readJsonFilesFromPathSync(P_FIELD_PATH);
    modelUtils.loadSchemasIntoStore(collectionDef);
    modelUtils.loadSchemasIntoStore(fieldDef);
    modelUtils.loadSchemasFromDB().then(() => {
      modelUtils.loadDataFromPath(config.root +
          '/resources/platform/updates/**.json');
      platformRoutes(that);
      let p_user = new Model('p_user');
      p_user.where({
        username: 'admin'
      }).count((err, count) => {
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
    p_collection.upsert({
      name: collectionDef.name,
      label: collectionDef.label
    }, {name: collectionDef.name}).then(function(collectionRecord) {
      let promises = [];
      collectionDef.fields.forEach(function(field) {
        promises.push(p_field.create({
          name: field.name,
          label: field.label ?
              field.label :
              stringUtils.underscoreToCamelCase(field.name),
          type: field.type,
          display_value: field.display_value,
          ref_collection: collectionRecord.id
        }));
      });

      Q.all(promises).then(function() {
        dfd.resolve();
      });
    });
    return dfd.promise;
  }

  scanApplications() {
    let that = this;
    logger.info('Scanning for apps');
    glob.sync(PROD_PATH + '**/config.json').forEach(file => {
      let config = fileUtils.readJsonFileSync(file);
      new Model('p_application').findOneAndUpdate({package: config.package},
          config);
      that.serveStaticFiles(config.package);
    });
  }

  installApplication(appId) {
    let that = this;
    let dfd = Q.defer();
    logger.info('STARTED INSTALLING');
    new Model('p_application').findById(appId).then((application) => {
      let modelDef = Platform.readModelsForPackage(application.package);
      modelUtils.loadSchemasIntoStore(modelDef);
      Platform.loadDataForPackage(application.package);
      let promises = [];
      modelDef.forEach((model) => {
        promises.push(that.populateSysData(model));
      });
      application.installed_version = application.version;
      promises.push(application.save());
      Q.all(promises).then(dfd.resolve);
      that.serveStaticFiles(application.package);
    });
    return dfd.promise;
  }

  serveStaticFiles(pkg) {
    this.router.use('/ui/' + pkg,
        express.static(config.root + '/resources/apps/prod/' + pkg + '/ui'));
  }

  cleanInstall() {
    return cleanInstall(this, PLATFORM_MODELS_PATH);
  }

  /** helper functions **/
  static readModelsForPackage(pkg) {
    let modelDefs = fileUtils.readJsonFilesFromPathSync(PROD_PATH + pkg +
        '/models/**.json');

    modelDefs.forEach(function(modelDef) {
      modelDef.fields.push({
        name: 'created_at',
        type: 'date'
      });
      modelDef.fields.push({
        name: 'updated_at',
        type: 'date'
      });
      modelDef.fields.push({
        name: 'created_by',
        type: 'string'
      });
      modelDef.fields.push({
        name: 'updated_by',
        type: 'string'
      });
    });
    return modelDefs;
  }

  static loadDataForPackage(pkg) {
    return modelUtils.loadDataFromPath(PROD_PATH + pkg + '/updates/**.json');
  }
}

module.exports = Platform;
