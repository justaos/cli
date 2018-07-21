const logger = require('../../config/logger');
const dsUtils = require('../../utils/ds-utils');
const hashUtils = require('../../utils/hash-utils');
const fileUtils = require('../../utils/file-utils');
const modelUtils = require('../../model/model-utils');

const Q = require('q');
const vm = require('vm');
const mongoose = require('mongoose');
const js2xmlparser = require('js2xmlparser');

const BaseService = require('./base-service');

const constants = require('../platform-constants');

class PlatformService extends BaseService {

    constructor(user) {
        super(user);
    }

    static loadPlatformUpdates() {
        return PlatformService.loadUpdates(constants.path.PATFORM_RESOUCES);
    }

    static loadUpdates(path) {
        return modelUtils.loadDataFromPath(path + '/updates/**.json');
    }

    getMenus(cb) {
        let that = this;
        let menuModel = this.getModel('p_menu');
        menuModel.find().exec(function (err, menus) {
            if (err)
                logger.error(err);
            that.filterBasedOnAccess('p_menu', menus, cb);
        });
    }

    filterBasedOnAccess(type, records, cb) {
        let that = this;
        let recordIDs = records.map(record => record.id);
        let filteredRecords = [];
        that.getACLs(type, recordIDs).then(function (acls) {
            let promises = [];
            records.forEach(function (record) {
                let dfd = Q.defer();
                promises.push(dfd.promise);
                let aclRolesForMenu = acls.filter(acl => acl.record_id === record.id).map(acl => acl.id);
                that.recordHasAccess(aclRolesForMenu).then(function (access) {
                    if (access)
                        filteredRecords.push(record);
                    dfd.resolve();
                });
            });
            Q.all(promises).then(function () {
                cb(filteredRecords);
            });
        });
    }

    recordHasAccess(aclIDs) {
        let that = this;
        let dfd = Q.defer();
        if (aclIDs.length) {
            let aclRoleModel = that.getModel('p_acl_role');
            aclRoleModel.skipPopulation().find({acl: aclIDs[0]}).exec(function (err, aclRoles) {
                aclRoles = aclRoles.map(aclRole => aclRole.toObject());
                dfd.resolve(that.hasAccess(aclRoles));
            });
        } else {
            dfd.resolve(true);
        }
        return dfd.promise;
    }

    getACLs(type, recordIDs) {
        let aclModel = this.getModel('p_acl');
        return aclModel.find({type: type, record_id: {$in: recordIDs}}).exec();
    }

    hasAccess(aclRoles) {
        let that = this;
        if (that.sessionUser.hasRole('admin') || !aclRoles.length)
            return true;
        let flag = false;
        aclRoles.forEach(function (aclRole) {
            if (that.sessionUser.hasRoleId(aclRole.role.toString())) {
                flag = true;
            }
        });
        return flag;
    }

    getMenuById(id, cb) {
        let menuModel = this.getModel('p_menu');
        menuModel.findById(id).exec(function (err, menu) {
            if (err)
                logger.error(err);
            else cb(menu);
        });
    }

    getMenuAndModules(menuId, cb) {
        let that = this;
        let promises = [];
        promises.push(this.getModel('p_menu').findById(menuId).exec());

        let moduleModel = this.getModel('p_module');
        moduleModel.skipPopulation();
        promises.push(moduleModel.find({ref_menu: menuId}, null, {sort: {order: 1}}).exec());

        Q.all(promises).then(function (responses) {
            let menu = responses[0];
            let modules = responses[1];
            if (menu && modules) {
                modules = modules.map(module => {
                    let m = module.toObject();
                    if (m.type === 'list') {
                        m.url = '/p/' + m.ref_collection + '/list';
                    } else if (m.type === 'new') {
                        m.url = '/p/' + m.ref_collection + '/new';
                    }
                    return m;
                });

                that.filterBasedOnAccess('p_module', modules, function (modules) {
                    modules = dsUtils.flatToHierarchy(modules);
                    cb(menu, modules);
                });

            } else
                cb(null);
        });
    }

    executeRestApi(req, res, cb) {
        let that = this;
        let restApiModel = this.getModel('p_rest_api');
        restApiModel.findOne({url: req.url, method: req.method}).exec((err, restApiRecord) => {
            if (restApiRecord) {
                let ctx = vm.createContext({req, res, Model: that.Model, js2xmlparser, JSON});
                vm.runInContext(restApiRecord.script, ctx);
            } else
                cb()
        });
    }

    async getCollectionFieldsAndScripts(collectionName, callBack) {
        let collection = this.getCollectionByName(collectionName);
        let fields = this.getFieldsForCollection(collectionName);
        let clientScripts = this.getClientScriptsForCollection(collectionName);
        let result = {collection: await collection, fields: await fields, clientScripts: await clientScripts};
        callBack(result.collection, result.fields, result.clientScripts);
    }

    async getFormResources(collectionName, callBack) {
        let collection = this.getCollectionByName(collectionName);
        let fields = this.getFieldsForCollection(collectionName);
        let clientScripts = this.getClientScriptsForCollection(collectionName);
        let defaultView = await this.getModel('p_view').skipPopulation().findOne({name: 'default_view'}).exec();
        let formView = await this.getModel('p_form').skipPopulation().findOne({
            view: defaultView.id,
            ref_collection: collectionName
        }).exec();
        let formSections = await (this.getModel('p_form_section').skipPopulation().find({form: formView.id}, null, {
            sort: {order: 1}
        }).exec());
        let formElements = this.getModel('p_form_element').skipPopulation().find({form_section: {$in: formSections.map(fs => fs.id)}}, null, {
            lean: true,
            sort: {order: 1}
        }).exec();
        callBack(await collection, await fields, await clientScripts, formView, formSections, await formElements);
    }

    populateOptions(fields, collectionName) {
        let that = this;
        let promises = [];
        let optionModel = this.getModel('p_option');
        let collections;
        fields.forEach(function (field) {
            if (field.type === 'option') {
                let dfd = Q.defer();
                promises.push(dfd.promise);
                optionModel.find({
                    ref_collection: collectionName,
                    field: field.name
                }, null, {sort: {order: 1}}).exec((err, options) => {
                    field.options = options.map(model => model.toObject());
                    dfd.resolve();
                });
            } else if (field.type === 'collection') {
                let dfd = Q.defer();
                promises.push(dfd.promise);
                if (collections) {
                    field.options = collections;
                    dfd.resolve();
                }
                else
                    that.getModel('p_collection').find().exec(function (err, cols) {
                        collections = cols.map(collection => collection.toObject());
                        field.options = collections;
                        dfd.resolve();
                    });
            } else if (field.type === 'reference' && field.ref) {
                let dfd = Q.defer();
                promises.push(dfd.promise);
                that.getDisplayFieldForCollection(field.ref).then(function (displayValueField) {
                    if (displayValueField)
                        field.display_value_field = displayValueField.toObject();
                    else {
                        field.display_value_field = {};
                        field.display_value_field.name = "id";
                    }
                    dfd.resolve();
                });
            }
        });
        return Q.all(promises);
    }

    getCollectionByName(collectionName) {
        let collectionModel = this.getModel('p_collection');
        return collectionModel.findOne({name: collectionName}, null, {lean: true}).exec();
    }

    getFieldsForCollection(collectionName) {
        let fieldModel = this.getModel('p_field');
        return fieldModel.find({ref_collection: collectionName}, null, {lean: true}).exec();
    }

    getClientScriptsForCollection(collectionName) {
        let clientScriptModel = this.getModel('p_client_script');
        return clientScriptModel.find({ref_collection: collectionName}, null, {lean: true}).exec();
    }


    getDisplayFieldForCollection(collectionName) {
        let fieldModel = this.getModel('p_field');
        let dfd = Q.defer();
        fieldModel.findOne({ref_collection: collectionName, display_value: true}).exec(function (err, field) {
            if (!field)
                fieldModel.findOne({ref_collection: collectionName, name: 'id'}).exec().then(dfd.resolve);
            else
                dfd.resolve(field);
        });
        return dfd.promise;
    }

    executeAction(collectionName, recordIds, cb) {
        let model = this.getModel(collectionName);
        model.remove({_id: recordIds}).exec(function (err) {
            cb(err);
        });
    }

    getListFormData(collectionName, query, cb, fail) {
        let that = this;
        this.getCollectionByName(collectionName).then(function (collection) {
            that.getFieldsForCollection(collectionName).then(function (fields) {
                let conditions = {}, options;
                if (query.sort) {
                    options = {};
                    options.sort = JSON.parse(query.sort);
                }
                if (query.conditions) {
                    conditions = JSON.parse(query.conditions);
                }
                let collectionModel = that.getModel(collectionName);
                let colQuery = collectionModel.find(conditions, null, options);
                let promises = [];
                fields.forEach(function (field) {
                    if (field.type === 'reference' && field.ref) {
                        let dfd = Q.defer();
                        promises.push(dfd.promise);
                        that.getDisplayFieldForCollection(field.ref).then(function (displayValueField) {
                            if (displayValueField)
                                field.display_value_field = displayValueField.toObject();
                            else {
                                field.display_value_field = {};
                                field.display_value_field.name = "id";
                            }
                            dfd.resolve();
                        });
                    }
                });
                Q.all(promises).then(function () {
                    colQuery.exec(function (err, data) {
                        if (err)
                            console.log(err);
                        let collectionObj = {
                            label: collection.label,
                            name: collection.name
                        };
                        cb(collectionObj, data, fields);
                    });
                });
            });
        });
    }


    findRecordById(modelName, id) {
        let model = this.getModel(modelName);
        return model.findById(id).exec();
    }

    createRecord(modelName, record) {
        let model = this.getModel(modelName);
        model.getDefinition().fields.forEach(function (field) {
            if (field.type === 'password' && record[field.type]) {
                record[field.type] = hashUtils.generateHash(record[field.type]);
            }
        });
        return model.create(record);
    }

    updateRecord(modelName, record) {
        let model = this.getModel(modelName);
        model.getDefinition().fields.forEach(function (field) {
            if (field.type === 'password' && record[field.type]) {
                record[field.type] = hashUtils.generateHash(record[field.type]);
            }
        });
        return model.update({_id: record.id}, {$set: record}).exec();
    }

    fieldSearch(q, collectionName, fieldName) {
        let dfd = Q.defer();
        let that = this;
        let fieldModel = this.getModel('p_field');
        fieldModel.findOne({ref_collection: collectionName, name: fieldName}).exec(function (err, field) {
            that.getDisplayFieldForCollection(field.ref).then(function (displayField) {
                let model = that.getModel(field.ref);
                model.find({[displayField.name]: {"$regex": q, "$options": "i"}}, null, {
                    sort: {[displayField.name]: 1},
                    limit: 10
                }).exec(function (err, items) {
                    dfd.resolve(items.map(function (item) {
                        return {
                            "value": item.id,
                            "text": item[displayField.name]
                        }
                    }))
                })
            });
        });
        return dfd.promise;
    }

    getRecords(collectionName, recordIDs) {
        let model = this.getModel(collectionName);
        model.skipPopulation();
        return model.find({
            _id: {
                $in: recordIDs.map(function (id) {
                    return mongoose.Types.ObjectId.ObjectId(id);
                })
            }
        }).exec();
    }
}

module.exports = PlatformService;
