const Q = require('q');
const logger = require('../../config/logger');

const BaseService = require('./base-service');
const modelUtils = require('../../model/model-utils');
const fileUtils = require('../../utils/file-utils');
const constants = require('../platform-constants');

let defaultFields = fileUtils.readJsonFileSync(constants.path.DEFAULT_FIELDS);

function findDefaultField(fieldName) {
    let i = 0;
    for (i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].name === fieldName) {
            return defaultFields[i];
        }
    }
}

class ViewService extends BaseService {

    constructor(user, collectionName) {
        super(user);
        this.collectionName = collectionName;
    }

    createDefaultView() {
        let that = this;
        let collectionModel = this.getModel('p_collection');
        let fieldModel = this.getModel('p_field');
        let viewModel = this.getModel('p_view');
        let promises = [];
        promises.push(collectionModel.findOne({name: this.collectionName}).exec());
        promises.push(fieldModel.find({ref_collection: this.collectionName}).exec());
        promises.push(viewModel.findOne({name: 'default_view'}).exec());
        Q.all(promises).then(function (res) {
            that.createDefaultFormView(res[0], res[1], res[2]);
            that.createDefaultListView(res[0], res[1], res[2]);
        })
    }

    createDefaultFormView(collection, fields, defaultView) {
        let formModel = this.getModel('p_form');
        let formSectionModel = this.getModel('p_form_section');
        let formElementModel = this.getModel('p_form_element');

        formModel.upsert({
            ref_collection: collection.name,
            view: defaultView.id
        }, {
            ref_collection: collection.name,
            view: defaultView.id
        }).exec(function (err, formView) {
            formSectionModel.upsert({
                form: formView.id,
                name: "default"
            }, {
                form: formView.id,
                name: "default"
            }).exec(function (err, formSection) {
                let order = 100;
                fields.forEach(function (field) {
                    if (!findDefaultField(field.name)) {
                        formElementModel.upsert({
                            form_section: formSection.id,
                            element: field.name
                        }, {
                            form_section: formSection.id,
                            element: field.name,
                            order: order,
                            type: 'element'
                        }).exec();
                        order += 100;
                    }
                })
            });
        })
    }

    createDefaultListView(collection, fields, defaultView) {
        let listModel = this.getModel('p_list');
        let listElementModel = this.getModel('p_list_element');

        listModel.upsert({
            ref_collection: collection.name,
            view: defaultView.id
        }, {
            ref_collection: collection.name,
            view: defaultView.id
        }).exec(function (err, listView) {
            let order = 100;
            fields.forEach(function (field) {
                if (!findDefaultField(field.name) && field.type !== "password") {
                    listElementModel.upsert({
                        list: listView.id,
                        element: field.name
                    }, {
                        list: listView.id,
                        element: field.name,
                        order: order,
                        type: 'element'
                    }).exec();
                    order += 100;
                }
            })
        });

    }
}

module.exports = ViewService;