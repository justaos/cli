'use strict';
const express = require('express');
const Q = require('q');
const glob = require('glob');

const logger = require('../config/logger');
const config = require('../config/config');

const stringUtils = require('../utils/string-utils');
const fileUtils = require('../utils/file-utils');

const DatabaseConnector = require('../config/database-connector');
const cleanInstall = require('./clean-install');
const ModelSessionFactory = require('../model/model-session-fatory');

const modelUtils = require('../model/model-utils');
const platformRoutes = require('./platform-routes');
const {path} = require('./platform-constants');

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
        let collectionDef = fileUtils.readJsonFilesFromPathSync(path.P_COLLECTION_MODEL);
        let fieldDef = fileUtils.readJsonFilesFromPathSync(path.P_FIELD_MODEL);
        let optionDef = fileUtils.readJsonFilesFromPathSync(path.P_OPTION_MODEL);
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
                promises.push(p_field.upsert({name: field.name, ref_collection: collectionRecord.name}, {
                    name: field.name,
                    label: field.label ?
                        field.label :
                        stringUtils.underscoreToCamelCase(field.name),
                    type: field.type,
                    display_value: field.display_value,
                    ref_collection: collectionRecord.name,
                    ref: field.ref
                }).exec());
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
        glob.sync(path.APPS + '/**/config.json').forEach(file => {
            let config = fileUtils.readJsonFileSync(file);
            applicationModel.upsert({package: config.package}, config).exec();
            that.serveStaticFiles(config.package);
        });
    }

    serveStaticFiles(pkg) {
        this.router.use('/ui/' + pkg, express.static(path.APPS + '/' + pkg + '/ui'));
    }

    cleanInstall() {
        return cleanInstall(this, path.PATFORM_MODELS + '/**.json');
    }
}

module.exports = Platform;
