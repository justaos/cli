const Q = require('q');
const jsonToSchemaConverter = require('./json-to-schema-converter');
const logger = require('../config/logger');
const ModelBuilder = require('anysols-model').ModelBuilder;
const model = new ModelBuilder().build();
const DatabaseConnector = require('anysols-model').DatabaseConnector;
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
        let Model = model(data.collection);
        if (data.record)
            return Model.upsert({_id: data.record.id}, data.record).exec();
        else if (data.records) {
            let promises = [];
            data.records.forEach(function (record) {
                promises.push(Model.upsert({_id: record.id}, record).exec());
            });
            return Q.all(promises);
        }
    },

    loadDataFromPath(path) {
        let that = this;
        let promises = [];
        glob.sync(path).forEach(function (file) {
            let data = fileUtils.readJsonFileSync(file);
            let promise = that.loadData(data);
            promises.push(promise);
        });
        return Q.all(promises);
    },

    loadSchemasFromDB() {
        let dfd = Q.defer();
        let conn = DatabaseConnector.getInstance().getConnection();
        let backlog = {};
        let loadSchemaFn = loadSchemaFactory(conn, backlog);
        let Collection = model('p_collection');
        let Field = model('p_field');
        Collection.find({}).exec().then((collections) => {
            if (collections.length) {
                let promises = [];
                collections.forEach((collectionRecord) => {
                    let collection = collectionRecord.toObject();
                    if (collection.name !== 'p_collection' && collection.name !== 'p_field' && collection.name !== 'p_option') {
                        let collectionDef = {
                            'name': collection.name,
                            'label': collection.label,
                            'fields': []
                        };
                        let fieldDfd = Q.defer();
                        promises.push(fieldDfd.promise);
                        Field.find({ref_collection: collection.name}).exec().then((fields) => {
                            collectionDef.fields = fields.map(field => field.toObject());
                            loadSchemaFn(collectionDef);
                            fieldDfd.resolve();
                        });
                    }
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
    return function loadSchema(schemaDefinition) {
        let schema = jsonToSchemaConverter(schemaDefinition);
        if (!schemaDefinition.extends) {
            if (!conn.models[schemaDefinition.name]) {
                conn.model(schemaDefinition.name, schema, schemaDefinition.name);
                conn.models[schemaDefinition.name].definition = schemaDefinition;
                logger.info('model-utils (loadSchemaFactory) ::', ' loaded ' + schemaDefinition.name);
            } else {
                logger.info('model-utils (loadSchemaFactory) ::', ' model already loaded : ' + schemaDefinition.name);
            }
        }
        else {
            let extendsModel = conn.models[schemaDefinition.extends];
            if (extendsModel) {
                conn.model(schemaDefinition.extends).discriminator(schemaDefinition.name, schema);
            } else {
                if (!backlog[schemaDefinition.extends]) {
                    backlog[schemaDefinition.extends] = [];
                }
                backlog[schemaDefinition.extends].push(schemaDefinition);
            }
        }

        if (backlog[schemaDefinition.name]) {
            backlog[schemaDefinition.name].forEach(function (def) {
                loadSchema(def);
            });
            delete backlog[schemaDefinition.name];
        }
    };
}

module.exports = ModelUtils;