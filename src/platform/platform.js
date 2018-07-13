'use strict';
const DatabaseConnector = require('../config/database-connector');
const express = require('express');
const Q = require('q');
const logger = require('../config/logger');
const config = require('../config/config');

const stringUtils = require('../utils/string-utils');
const fileUtils = require('../utils/file-utils');
const cleanInstall = require('./clean-install');
const ModelSessionFactory = require('../collection/model-session-fatory');

const modelUtils = require('../model/model-utils');
const glob = require('glob');
const platformRoutes = require('./platform-routes');

let PLATFORM_MODELS_PATH = config.root + '/resources/platform/models/**.json';
let P_COLLECTION_PATH = config.root +
    '/resources/platform/models/p_collection.json';
let P_FIELD_PATH = config.root + '/resources/platform/models/p_field.json';
let P_OPTION_PATH = config.root + '/resources/platform/models/p_option.json';
let P_DEFAULT_FIELDS_PATH = config.root + '/resources/platform/default-fields.json';

let PROD_PATH;
if (config.mode === 'internal')
    PROD_PATH = config.cwd + '/resources/apps/';
else
    PROD_PATH = config.cwd + '/apps/';

let Model = ModelSessionFactory.createModelWithSession();

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
        let collectionDef = fileUtils.readJsonFilesFromPathSync(P_COLLECTION_PATH);
        let fieldDef = fileUtils.readJsonFilesFromPathSync(P_FIELD_PATH);
        let optionDef = fileUtils.readJsonFilesFromPathSync(P_OPTION_PATH);
        modelUtils.loadSchemasIntoStore(collectionDef);
        modelUtils.loadSchemasIntoStore(fieldDef);
        modelUtils.loadSchemasIntoStore(optionDef);
        modelUtils.loadSchemasFromDB().then(() => {
            modelUtils.loadDataFromPath(config.root +
                '/resources/platform/updates/**.json');
            platformRoutes(that);
            that.scanApplications();
            logger.logBox();
            logger.logBox('Application started');
            logger.logBox();
        });
    }

    populateSysData(collectionDef) {
        let dfd = Q.defer();
        let p_field = new Model('p_field');
        let p_option = new Model('p_option');
        Platform.upsertCollection(collectionDef).then(function (collectionRecord) {
            let promises = [];
            collectionDef.fields.forEach(function (field) {
                promises.push(p_field.upsert({name: field.name, ref_collection: collectionRecord.id}, {
                    name: field.name,
                    label: field.label ?
                        field.label :
                        stringUtils.underscoreToCamelCase(field.name),
                    type: field.type,
                    display_value: field.display_value,
                    ref_collection: collectionRecord.id
                }).exec());
                if (field.type === 'option' && field.options)
                    field.options.forEach(function (optionRecord) {
                        optionRecord.ref_collection = collectionRecord.id;
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
        let p_collection = new Model('p_collection');

        return p_collection.upsert({name: collectionDef.name}, {
            name: collectionDef.name,
            label: collectionDef.label
        }).exec();
    }

    scanApplications() {
        let that = this;
        logger.info('Scanning for apps');
        let applicationModel = new Model('p_application');
        glob.sync(PROD_PATH + '**/config.json').forEach(file => {
            let config = fileUtils.readJsonFileSync(file);
            applicationModel.upsert({package: config.package}, config).exec();
            that.serveStaticFiles(config.package);
        });
    }

    installApplication(appId, loadSampleData) {
        let that = this;
        let dfd = Q.defer();
        logger.info('STARTED INSTALLING');

        let applicationModel = new Model('p_application');
        applicationModel.findById(appId).exec((err, application) => {
            let modelDef = Platform.readModelsForPackage(application.package);
            modelUtils.loadSchemasIntoStore(modelDef);
            Platform.loadDataForPackage(application.package);
            if (loadSampleData)
                Platform.loadSampleDataForPackage(application.package);
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
        this.router.use('/ui/' + pkg, express.static(PROD_PATH + pkg + '/ui'));
    }

    cleanInstall() {
        return cleanInstall(this, PLATFORM_MODELS_PATH);
    }

    /** helper functions **/
    static readModelsForPackage(pkg) {
        let modelDefs = fileUtils.readJsonFilesFromPathSync(PROD_PATH + pkg + '/models/**.json');

        let defaultFields = fileUtils.readJsonFileSync(P_DEFAULT_FIELDS_PATH);

        modelDefs.forEach(function (modelDef) {
            modelDef.fields = modelDef.fields.concat(defaultFields);
        });
        return modelDefs;
    }

    static loadDataForPackage(pkg) {
        return modelUtils.loadDataFromPath(PROD_PATH + pkg + '/updates/**.json');
    }

    static loadSampleDataForPackage(pkg) {
        return modelUtils.loadDataFromPath(PROD_PATH + pkg + '/samples/**.json');
    }
}

module.exports = Platform;
