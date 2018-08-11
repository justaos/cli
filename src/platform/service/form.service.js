const Q = require('q');
const vm = require('vm');
const mongoose = require('mongoose');
const hashUtils = require('../../utils/hash-utils');

const BaseService = require('./base.service');

class FormService extends BaseService {

    constructor(user) {
        super(user);
    }

    async getFormResources(collectionName, callBack) {
        let collectionPromise = this._getCollectionByName(collectionName);
        let fieldsPromise = this.getFieldsForCollection(collectionName);
        let clientScriptsPromise = this._getClientScriptsForCollection(collectionName);
        let defaultView = await this._getViewByName('default_view');
        let formView = await this._as.model('p_form').findOne({
            view: defaultView.getID(),
            ref_collection: collectionName
        }).exec();
        let formSections = await
            this._as.model('p_form_section').find({form: formView.getID()}, null, {
                sort: {order: 1}
            }).exec();
        let formElementsPromise = this._as.model('p_form_element').find({form_section: {$in: formSections.map(fs => fs.getID())}}, null, {
            lean: true,
            sort: {order: 1}
        }).exec();


        let fields = await fieldsPromise;
        await this.populateOptions(fields, collectionName);

        callBack(await collectionPromise, fields, await clientScriptsPromise, formView, formSections, await formElementsPromise);
    }

    async getListFormResources(collectionName, query, callBack) {
        let that = this;
        let conditions = {}, options;
        if (query.sort) {
            options = {};
            options.sort = JSON.parse(query.sort);
        }
        if (query.conditions) {
            conditions = JSON.parse(query.conditions);
        }
        let Model = that._as.model(collectionName);
        let records = Model.populateReferences().find(conditions, null, options).exec();
        let collectionPromise = this._getCollectionByName(collectionName);
        let fieldsPromise = this.getFieldsForCollection(collectionName);

        let defaultView = await this._getViewByName('default_view');
        let listView = await
            this._as.model('p_list').findOne({
                view: defaultView.getID(),
                ref_collection: collectionName
            }).exec();

        let listElements = this._as.model('p_list_element').find({list: listView.getID()}, null, {
            lean: true,
            sort: {order: 1}
        }).exec();

        let result = {collection: await collectionPromise, fields: await fieldsPromise, records: await records};
        await this.populateOptions(result.fields, collectionName);
        callBack(null, result.collection, result.records, result.fields, listView, await listElements);
    }

    _getCollectionByName(collectionName) {
        let Model = this._as.model('p_collection');
        return Model.findOne({name: collectionName}).exec();
    }

    _getViewByName(name) {
        let View = this._as.model('p_view');
        return View.findOne({name: name}).exec();
    }

    getFieldsForCollection(collectionName) {
        let fieldModel = this._as.model('p_field');
        return fieldModel.find({ref_collection: collectionName}).exec();
    }

    populateOptions(fields, collectionName) {
        let that = this;
        let promises = [];
        let Option = this._as.model('p_option');
        let collections;
        fields.forEach(function (field) {
            let type = field.get('type');
            let dfd = Q.defer();
            if (type === 'option') {
                promises.push(dfd.promise);
                Option.find({
                    ref_collection: collectionName,
                    field: field.get('name')
                }, null, {sort: {order: 1}}).exec().then((options) => {
                    field.options = options.map(option => option.toObject());
                    dfd.resolve();
                });
            } else if (type === 'collection') {
                promises.push(dfd.promise);
                if (collections) {
                    field.options = collections;
                    dfd.resolve();
                }
                else
                    that._as.model('p_collection').find().exec().then(function (cols) {
                        collections = cols.map(collection => collection.toObject());
                        field.options = collections;
                        dfd.resolve();
                    });
            } else if (type === 'reference' && field.get('ref')) {
                promises.push(dfd.promise);
                that._getDisplayFieldForCollection(field.get('ref')).then(function (displayValueField) {
                    field.display_value_field = displayValueField;
                    dfd.resolve();
                });
            }
        });
        return Q.all(promises);
    }

    findRecordById(modelName, id) {
        let Model = this._as.model(modelName);
        return Model.populateReferences().findById(id).exec();
    }

    createRecord(modelName, plainRecord) {
        let Model = this._as.model(modelName);
        return new Model(plainRecord);
    }

    async getRelatedLists(collectionName, viewId, current, callBack) {
        let relatedList = await this._as.model('p_related_list').findOne({
            view: viewId,
            ref_collection: collectionName
        }).exec();

        let relatedListElements;
        if (relatedList) {
            relatedListElements = await
                this._as.model('p_related_list_element').find({
                    related_list: relatedList.getID()
                }, null, {
                    lean: true,
                    sort: {order: 1}
                }).exec();

            for (let i in relatedListElements) {
                if (relatedListElements.hasOwnProperty(i)) {
                    let relatedListElement = relatedListElements[i];
                    if (relatedListElement.get('filter')) {
                        relatedListElement.conditions = await (new Promise((resolve, reject) => {
                            let ctx = vm.createContext({current, resolve, reject});
                            vm.runInContext(relatedListElement.get('filter'), ctx);
                        }));
                    }
                }
            }
        }
        callBack(relatedList, relatedListElements);
    }

    async fieldSearch(q, collectionName, fieldName) {
        let that = this;
        let Field = this._as.model('p_field');
        let field = await Field.findOne({ref_collection: collectionName, name: fieldName}).exec();
        let displayField = await that._getDisplayFieldForCollection(field.get('ref'));
        let Model = that._as.model(field.get('ref'));
        let items = await Model.find({[displayField.get('name')]: {"$regex": q, "$options": "i"}}, null, {
            sort: {[displayField.get('name')]: 1},
            limit: 10
        }).exec();
        return items.map(function (item) {
            return {
                "value": item.getID(),
                "text": item.get(displayField.get('name'))
            }
        });
    }

    getRecords(collectionName, recordIDs, byOrder) {
        let Model = this._as.model(collectionName);
        let conditions;
        if (byOrder) {
            conditions = {sort: {order: 1}};
        }
        return Model.find({
            _id: {
                $in: recordIDs.map(function (id) {
                    return mongoose.Types.ObjectId.ObjectId(id);
                })
            }
        }, null, conditions).exec();
    }

    async saveRecord(modelName, plainRecord) {
        let Model = this._as.model(modelName);
        Model.getDefinition().fields.forEach(function (field) {
            if (field.type === 'password' && plainRecord[field.type]) {
                plainRecord[field.type] = hashUtils.generateHash(plainRecord[field.type]);
            }
        });
        let record = await Model.findById(plainRecord.id).exec();
        if (!record)
            record = new Model(plainRecord);
        else {
            Object.keys(plainRecord).forEach(function (key) {
                if (key !== 'id')
                    record.set(key, plainRecord[key]);
            });
        }
        return await record.save();
    }

    async _getDisplayFieldForCollection(collectionName) {
        let Field = this._as.model('p_field');
        let field = await Field.findOne({ref_collection: collectionName, display_value: true}).exec();
        if (field)
            return field;
        else
            return await Field.findOne({ref_collection: collectionName, name: 'id'}).exec();
    }

    _getClientScriptsForCollection(collectionName) {
        let ClientScript = this._as.model('p_client_script');
        return ClientScript.find({ref_collection: collectionName}).exec();
    }

}

module.exports = FormService;