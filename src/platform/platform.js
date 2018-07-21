'use strict';
const express = require('express');
const Q = require('q');
const glob = require('glob');

const logger = require('../config/logger');
const stringUtils = require('../utils/string-utils');
const fileUtils = require('../utils/file-utils');

const DatabaseConnector = require('../config/database-connector');
const ModelSessionFactory = require('../model/model-session-fatory');

const modelUtils = require('../model/model-utils');
const platformRoutes = require('./platform-routes');
const constants = require('./platform-constants');

let Model = ModelSessionFactory.createModelWithSession();

const PlatformService = require('./service/platform-service');
const ViewService = require('./service/view.service');


class Platform {

    constructor(router) {
        this.router = router;
    }

    initialize() {
        let dfd = Q.defer();
        const db = new DatabaseConnector();
        db.connect().then(() => {
            DatabaseConnector.setInstance(db);
            dfd.resolve(db);
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
        let p_field = new Model(constants.model.FIELD);
        let p_option = new Model(constants.model.OPTION);
        Platform.upsertCollection(collectionDef).then(function (collectionRecord) {
            let promises = [];
            collectionDef.fields.forEach(function (field) {
                if (!field.label) {
                    field.label = stringUtils.underscoreToCamelCase(field.name);
                }
                field.ref_collection = collectionRecord.name;

                promises.push(p_field.upsert({name: field.name, ref_collection: collectionRecord.name}, field).exec());
                if (field.type === 'option' && field.options)
                    field.options.forEach(function (optionRecord) {
                        optionRecord.ref_collection = collectionRecord.name;
                        optionRecord.field = field.name;
                        promises.push(p_option.upsert({
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


    static upsertCollection(collectionDef) {
        let p_collection = new Model(constants.model.COLLECTION);
        return p_collection.upsert({name: collectionDef.name}, {
            name: collectionDef.name,
            label: collectionDef.label
        }).exec();
    }

    scanApplications() {
        let that = this;
        logger.info('Scanning for apps');
        let applicationModel = new Model(constants.model.APPLICATION);
        glob.sync(constants.path.APPS + '/**/config.json').forEach(file => {
            let config = fileUtils.readJsonFileSync(file);
            applicationModel.upsert({package: config.package}, config).exec();
            that.serveStaticFiles(config.package);
        });
    }

    serveStaticFiles(pkg) {
        this.router.use('/ui/' + pkg, express.static(constants.path.APPS + '/' + pkg + '/ui'));
    }

    cleanInstall() {
        let that = this;
        let db = DatabaseConnector.getInstance();
        let dfd = Q.defer();
        logger.info('platform', 'clean installing...');
        db.dropDatabase().then(function () {
            let platformSchemaDefinitions = fileUtils.readJsonFilesFromPathSync(constants.path.PATFORM_MODELS + '/**.json');
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
