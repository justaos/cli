const logger = require('../../config/logger');
const dsUtils = require('../../utils/ds-utils');
const Q = require('q');
const vm = require('vm');
const mongoose = require('mongoose');
const js2xmlparser = require('js2xmlparser');

const BaseService = require('./base-service');

class PlatformService extends BaseService {

    constructor(user) {
        super(user);
    }

    getMenus(cb) {
        let that = this;
        let menuModel = this.getModel('p_menu');
        menuModel.find().exec(function (err, menus) {
            if (err)
                logger.error(err);

            let recordIDs = menus.map(menu => menu.id);
            let aclModel = that.getModel('p_acl');
            let aclRoleModel = that.getModel('p_acl_role');
            let resultMenus  = [];
            let promises = [];
            aclModel.find({type: 'p_menu', record_id: {$in: recordIDs}}).exec(function(err, acls) {
                menus.forEach(function (menu) {      
                   let dfd = Q.defer();
                   promises.push(dfd.promise);
                   let aclRolesForMenu = acls.filter(acl => acl.record_id == menu.id).map(acl => acl.id);
                   if(aclRolesForMenu.length){
                       aclRoleModel.find({acl: aclRolesForMenu[0].id}).then(function(aclRoles){
                           let flag = false;
                           aclRoles.forEach(function(aclRole){
                               if(this.sessionUser.hasRoleId(aclRole)){
                                   flag = true;
                               }
                           });
                           if(flag){
                               resultMenus.push(menu);
                               dfd.resolve();
                           }
                       });
                   } else {
                      resultMenus.push(menu);
                      dfd.resolve();
                   }
                }); 
                Q.all(promises).then(function(){
                   cb(resultMenus);
                });
            });
        });
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
        let promises = [];
        promises.push(this.getModel('p_menu').findById(menuId).exec());

        let moduleModel = this.getModel('p_module');
        moduleModel.skipReferenceFieldPopulation();
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

                modules = dsUtils.flatToHierarchy(modules);
                cb(menu, modules);
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
        return collectionModel.findOne({name: collectionName}).exec();
    }

    getFieldsForCollection(collectionName) {
        let fieldModel = this.getModel('p_field');
        return fieldModel.find({ref_collection: collectionName}).exec();
    }

    getDisplayFieldForCollection(collectionName) {
        let fieldModel = this.getModel('p_field');
        return fieldModel.findOne({ref_collection: collectionName, display_value: true}).exec();
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
                        let collectionObj = {
                            label: collection.label,
                            name: collection.name
                        };
                        cb(collectionObj, data, fields);
                    });
                });

            })
        });
    }

    findRecordById(modelName, id) {
        let model = this.getModel(modelName);
        return model.findById(id).exec();
    }

    createRecord(modelName, record) {
        let model = this.getModel(modelName);
        return model.create(record);
    }

    updateRecord(modelName, record) {
        /*collectionModel.getSchemaDef().fields.forEach(function (field) {
                if (field.type === 'password' && req.body[field.type]) {
                    req.body[field.type] = hashUtils.generateHash(req.body[field.type]);
                }
            });
            */

        let model = this.getModel(modelName);
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
        model.skipReferenceFieldPopulation();
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
