'use strict';
const glob = require('glob');
const Q = require('q');
const platformUtils = require('./platform-utils');
const platformRoutes = require('../src/platform/platform-routes');
const logger = require('../src/config/logger');
const config = require('../config/config');

const utils = require('../utils');
const hashUtils = require('../src/utils/hash-utils');
const fileUtils = require('../src/utils/file-utils');

module.exports = function(database, router) {
  class Platform {
    constructor() {
      this.appStarting = true;
    }

    static createColumn(col, tableId) {
      return database.getModel('p_field').create({
        name: col.name,
        label: col.label ? col.label : utils.underscoreToCamelCase(col.name),
        type: col.type,
        table: tableId
      });
    }

    boot() {
      let dfd = Q.defer();
      let that = this;
      logger.log('BOOT:: start');
      database.createDatabase().then(function() {
        database.connect();
        let sequelize = database.getConnection();
        let modelPath = config.root + '/platform/models/**.json';
        that.createPlatformTables(sequelize, modelPath).then(function() {
          let promises = [];
          glob.sync(modelPath).forEach(function(file) {
            let tableJson = fileUtils.readJsonFileSync(file);
            promises.push(that.populateSysData(tableJson));
          });
          Q.all(promises).then(function() {
            dfd.resolve();
          });
        });
        logger.log('BOOT:: end');
      });
      return dfd.promise;
    }

    populateSysData(tableJson) {
      let that = this;
      let dfd = Q.defer();
      database.getModel('p_collection').
          findOne({where: {name: tableJson.name}}).
          then(function(table) {
            if (!table)
              database.getModel('p_collection').create({
                name: tableJson.name,
                label: tableJson.label
              }).then(function(tableRecord) {
                let promises = [];
                tableJson.columns.forEach(function(col) {
                  promises.push(Platform.createColumn(col, tableRecord.id));
                });
                Q.all(promises).then(function() {
                  dfd.resolve();
                });
              });
            else {
              database.getModel('p_field').destroy({
                where: {
                  table: table.id
                }
              }).then(() => {
                let promises = [];
                tableJson.columns.forEach(function(col) {
                  promises.push(Platform.createColumn(col, table.id));
                });
                Q.all(promises).then(function() {
                  dfd.resolve();
                });
              });
            }
          });
      return dfd.promise;
    }

    createPlatformTables(sequelize, path) {
      let promises = [];
      glob.sync(path).forEach((file) => {
        let tableJson = fileUtils.readJsonFileSync(file);
        let tableSchemaDef = platformUtils.convertToScheme(tableJson);
        let tableSchema = sequelize.define(tableJson.name, tableSchemaDef);
        database.setModel(tableJson.name, tableSchema);
        promises.push(tableSchema.sync({force: true}));
      });
      return Q.all(promises);
    }

    startUp() {
      let that = this;
      let dfd = Q.defer();
      that.loadSchemas().then(function() {
        that.scanApplications();
        platformRoutes(database, router, that);
        database.getModel('p_user').count({
          username: 'admin'
        }).then((count) => {
          if (!count)
            database.getModel('p_user').create({
              username: 'admin',
              password: hashUtils.generateHash('admin')
            }).then(function() {
              dfd.resolve();
            });
          else
            dfd.resolve();
        });
      });

      return dfd.promise;
    }



    loadSchemas() {
      let that = this;
      that.loadSchemasFromPath(config.root + '/platform/models/**.json', true);
      that.loadData(config.root + '/platform/updates/**.json', true);
      return that.loadSchemasFromDB();
    }

    loadData(path) {
      glob.sync(path).forEach(function(file) {
        let data = fileUtils.readJsonFileSync(file);
        if (data.record)
          database.getModel(data.table).upsert(data.record);
        else if(data.records)
          data.records.forEach(function(record){
            database.getModel(data.table).upsert(record);
          })
      });
    }

    loadSchemasFromPath(path, alter) {
      let sequelize = database.getConnection();
      glob.sync(path).forEach(function(file) {
        let tableJson = fileUtils.readJsonFileSync(file);
        let tableSchemaDef = platformUtils.convertToScheme(tableJson);
        database.setModel(tableJson.name,
            sequelize.define(tableJson.name, tableSchemaDef));
        if (alter)
          database.getModel(tableJson.name).sync({alter: true});
      });
    }



    scanApplications() {
      logger.info('Scanning for apps');
      glob.sync(config.cwd + '/apps/**/config.json').forEach(function(file) {
        let config = fileUtils.readJsonFileSync(file);
        platformUtils.upsert(database.getModel('sys_application'), config,
            {package: config.package});
      });
    }
  }

  return new Platform();
};