const Q = require('q');
const jsonToSchemaConverter = require('./json-to-schema-converter');
const logger = require('../config/logger');
const Model = require('../collection');
const DatabaseConnector = require('../config/database-connector');
const glob = require('glob');
const fileUtils = require('../utils/file-utils');

let ModelUtils = {

    loadSchemasIntoStore(defs) {
        let conn = DatabaseConnector.getInstance().getConnection();
        let backlog = {};
        let loadSchemaFn = loadSchemaFactory(conn, backlog);
        defs.forEach(loadSchemaFn);
    },

    loadData(data) {
        let model = new Model(data.collection);
        if (data.record)
            return model.upsert({_id: data.record.id}, data.record).exec();
        else if (data.records) {
            let promises = [];
            data.records.forEach(function (record) {
                promises.push(model.upsert({_id: record.id}, record).exec());
            });
            return Q.all(promises);
        }
    },

    loadDataFromPath(path) {
        let that = this;
        glob.sync(path).forEach(function (file) {
            let data = fileUtils.readJsonFileSync(file);
            that.loadData(data);
        });
    },

    loadSchemasFromDB() {
        let dfd = Q.defer();
        let conn = DatabaseConnector.getInstance().getConnection();
        let backlog = {};
        let loadSchemaFn = loadSchemaFactory(conn, backlog);
        let p_collection = new Model('p_collection');
        let p_field = new Model('p_field');
        p_collection.find({}).exec((err, collections) => {
            if (collections.length) {
                let promises = [];
                collections.forEach((collection) => {

                    let collectionDef = {
                        'name': collection.name,
                        'label': collection.label,
                        'fields': []
                    };
                    let fieldDfd = Q.defer();
                    promises.push(fieldDfd.promise);
                    p_field.find({ref_collection: collection.id}).exec((err, fields) => {
                        fields.forEach(function (field) {
                            collectionDef.fields.push({
                                name: field.name,
                                type: field.type
                            });
                        });
                        loadSchemaFn(collectionDef);
                        fieldDfd.resolve();
                    });
                });
                Q.all(promises).then(dfd.resolve);
            }
            else
                dfd.resolve();
        });
        return dfd.promise;
    }
};

function loadSchemaFactory(conn, backlog) {
    return function loadSchema(def) {
        let schema = jsonToSchemaConverter(def);
        logger.info('model', 'loading : ' + def.name);
        if (!def.extends) {
            if (!conn.models[def.name]) {
                conn.model(def.name, schema, def.name);
                conn.models[def.name].def = def;
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
            backlog[def.name].forEach(function (def) {
                loadSchema(def);
            });
            delete backlog[def.name];
        }
    };
}

module.exports = ModelUtils;