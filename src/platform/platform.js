'use strict';
const express = require('express');
const Q = require('q');
const glob = require('glob');

const logger = require('../config/logger');
const stringUtils = require('../utils/string-utils');
const fileUtils = require('../utils/file-utils');

const {DatabaseService, ModelBuilder} = require('anysols-model');

const modelUtils = require('./model-utils');
const platformRoutes = require('./platform-routes');
const constants = require('./platform-constants');

const model = new ModelBuilder().build();

const PlatformService = require('./service/platform.service');
const ViewService = require('./service/view.service');
const config = require('./../config/config');


class Platform {

    constructor(router) {
        this.router = router;
    }

    static upsertCollection(collectionDef) {
        let Collection = model(constants.model.COLLECTION);
        return Collection.upsert({name: collectionDef.name}, {
            name: collectionDef.name,
            label: collectionDef.label
        }).exec();
    }

    initialize() {
        let dfd = Q.defer();
        DatabaseService.connect(config.db).then(() => {
            DatabaseService.databaseExists().then(() => {
                dfd.resolve(true);
            }, () => {
                dfd.resolve(false)
            });
        }, dfd.reject);
        return dfd.promise;
    }

    boot() {
        let that = this;
        let collectionDef = fileUtils.readJsonFilesFromPathSync(constants.path.P_COLLECTION_MODEL);
        let fieldDef = fileUtils.readJsonFilesFromPathSync(constants.path.P_FIELD_MODEL);
        let optionDef = fileUtils.readJsonFilesFromPathSync(constants.path.P_OPTION_MODEL);
        modelUtils.loadSchemasIntoStore(collectionDef);
        modelUtils.loadSchemasIntoStore(fieldDef);
        modelUtils.loadSchemasIntoStore(optionDef);
        modelUtils.loadSchemasFromDB().then(() => {
            platformRoutes(that);
            that.scanApplications();
            logger.logBox();
            logger.logBox('Application started');
            logger.logBox();
        });
    }

    populateSysData(collectionDef) {
        let dfd = Q.defer();
        let Field = model(constants.model.FIELD);
        let Option = model(constants.model.OPTION);
        Platform.upsertCollection(collectionDef).then(function (collectionRecord) {
            let promises = [];
            collectionDef.fields.forEach(function (field) {
                if (!field.label) {
                    field.label = stringUtils.underscoreToCamelCase(field.name);
                }
                field.ref_collection = collectionRecord.get('name');

                promises.push(Field.upsert({
                    name: field.name,
                    ref_collection: collectionRecord.get('name')
                }, field).exec());
                if (field.type === 'option' && field.options)
                    field.options.forEach(function (optionRecord) {
                        optionRecord.ref_collection = collectionRecord.get('name');
                        optionRecord.field = field.name;
                        promises.push(Option.upsert({
                            ref_collection: optionRecord.ref_collection,
                            field: optionRecord.field,
                            label: optionRecord.label
                        }, optionRecord).exec());
                    });
            });

            Q.all(promises).then(dfd.resolve);
        });
        return dfd.promise;
    }

    scanApplications() {
        let that = this;
        logger.info('Scanning for apps');
        let Application = model(constants.model.APPLICATION);
        glob.sync(constants.path.APPS + '/**/config.json').forEach(file => {
            let config = fileUtils.readJsonFileSync(file);
            Application.upsert({package: config.package}, config).exec();
            that.serveStaticFiles(config.package);
        });
    }

    serveStaticFiles(pkg) {
        this.router.use('/ui/' + pkg, express.static(constants.path.APPS + '/' + pkg + '/ui'));
    }

    cleanInstall() {
        let that = this;
        let dfd = Q.defer();
        logger.info('platform', 'clean installing...');
        DatabaseService.dropDatabase().then(function () {
            let platformSchemaDefinitions = fileUtils.readJsonFilesFromPathSync(constants.path.PATFORM_MODELS + '/**.json');
            let defaultFields = fileUtils.readJsonFileSync(constants.path.DEFAULT_FIELDS);
            platformSchemaDefinitions.forEach(function (modelDef) {
                modelDef.fields = modelDef.fields.concat(defaultFields);
            });

            modelUtils.loadSchemasIntoStore(platformSchemaDefinitions);
            let promises = [];
            platformSchemaDefinitions.forEach(def => {
                promises.push(that.populateSysData(def));
            });
            Q.all(promises).then(() => {
                PlatformService.loadPlatformUpdates().then(function () {
                    platformSchemaDefinitions.forEach(def => {
                        new ViewService(null, def.name).createDefaultView();
                    });
                    logger.info('platform', 'clean installation complete');
                    dfd.resolve();
                });
            });
        });
        return dfd.promise;

    }
}

module.exports = Platform;
