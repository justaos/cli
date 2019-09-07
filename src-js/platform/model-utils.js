const Q = require('q');
const logger = require('../config/logger');
const {ModelBuilder, ModelService} = require('anysols-model');
const glob = require('glob');
const fileUtils = require('../utils/file-utils');

let anysolsModel;

let ModelUtils = {

    setAnysolsModel(am) {
        anysolsModel = am;
    },

    getAnysolsModel() {
        return anysolsModel;
    },

    loadSchemasIntoStore(defs) {
        let backlog = {};
        let loadSchemaFn = loadSchemaFactory(backlog);
        defs.forEach(loadSchemaFn);
    },

    loadData(data) {
        let Model = anysolsModel.model(data.collection);
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
        let backlog = {};
        let loadSchemaFn = loadSchemaFactory(backlog);
        let Collection = anysolsModel.model('p_collection');
        let Field = anysolsModel.model('p_field');
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

function loadSchemaFactory(backlog) {
    return function loadSchema(schemaDefinition) {
        if (!anysolsModel.isModelDefined(schemaDefinition.name)) {
            anysolsModel.defineModel(schemaDefinition);
            logger.info('model-utils (loadSchemaFactory) ::', ' loaded ' + schemaDefinition.name);
        } else {
            logger.info('model-utils (loadSchemaFactory) ::', ' model already loaded : ' + schemaDefinition.name);
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
