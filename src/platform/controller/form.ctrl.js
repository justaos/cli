'use strict';
const PlatformService = require('../service/platform.service');

const FormService = require('../service/form.service');
const moment = require('moment');
const url = require('url');

class FormController {

    listView(req, res, next) {
        let fs = new FormService(req.user);
        let pageUrl = new url.URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        fs.getListFormResources(req.params.collection, req.query, function (err, collection, data, fields, listView, listElements) {
            res.render('pages/list/list', {
                collection: collection.toObject(),
                data: data,
                fields: fields,

                listView: listView,
                listElements: listElements,

                moment: moment,
                layout: 'layouts/no-header-layout',
                user: req.user,
                pageUrl: pageUrl
            });
        }).catch(function (err) {
            next(err);
        });
    }


    createView(req, res, next) {
        let fs = new FormService(req.user);
        let pageUrl = new url.URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        fs.getFormResources(req.params.collection, function (collection, fields, clientScripts,
                                                             formView, formSections, formElements) {

            let record = populateDefaults({}, fields);

            res.render('pages/form/form', {
                collection: {
                    label: collection.get('label'),
                    name: collection.get('name')
                },
                fields: fields,
                record: fs.createRecord(req.params.collection, record),
                clientScripts: clientScripts,

                formView: formView,
                formSections: formSections,
                formElements: formElements,
                relatedList: null,
                relatedListElements: null,

                moment: moment,

                user: req.user,

                layout: 'layouts/no-header-layout',
                form: 'create',
                pageUrl: pageUrl
            });
        }).catch(function (err) {
            next(err);
        });
    }

    editView(req, res, next) {
        let fs = new FormService(req.user);
        let pageUrl = new url.URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        fs.getFormResources(req.params.collection, function (collection, fields, clientScripts,
                                                             formView, formSections, formElements) {
            fs.findRecordById(req.params.collection, req.params.id).then(function (record) {
                fs.getRelatedLists(req.params.collection, formView.get('view'), record, function (relatedList, relatedListElements) {

                    res.render('pages/form/form', {
                        collection: {
                            label: collection.get('label'),
                            name: collection.get('name')
                        },
                        fields: fields,
                        record: record,
                        clientScripts: clientScripts,

                        formView: formView,
                        formSections: formSections,
                        formElements: formElements,
                        relatedList: relatedList,
                        relatedListElements: relatedListElements,

                        moment: moment,

                        user: req.user,

                        layout: 'layouts/no-header-layout',
                        form: 'edit',
                        pageUrl: pageUrl
                    });
                });
            })

        }).catch(function (err) {
            next(err);
        });
    }

    formSubmit(req, res, next) {
        let fs = new FormService(req.user);
        fs.saveRecord(req.params.collection, req.body).then(function () {
            res.send();
        }).catch(err => {
            next(err);
        });
    }

    formAction(req, res, next) {
        let ps = new PlatformService(req.user);
        ps.executeAction(req.params.collection, req.body.items).then(function () {
            res.send();
        }).catch(err => {
            next(err);
        });
    }

    fieldSearch(req, res, next) {
        let fs = new FormService(req.user);
        fs.fieldSearch(req.body.q, req.params.collection, req.body.field).then(function (data) {
            res.send(data);
        }).catch(err => {
            next(err);
        });
    }

    exportRecords(req, res) {
        let fs = new FormService(req.user);
        fs.getRecords(req.params.collection, req.query.records, true).then(function (records) {
            let result = {};
            result.collection = req.params.collection;
            result.records = records.map(rec => {
                rec = rec.toObject();
                delete rec._id;
                delete rec.__v;
                delete rec.created_at;
                delete rec.created_by;
                delete rec.updated_at;
                delete rec.updated_by;

                return rec;
            });
            res.send(result);
        });
    }
}

function populateDefaults(item, fields) {
    fields.forEach(function (field) {
        if (!item[field.get('name')]) {
            item[field.get('name')] = field.get('default_value');
        }
    });
    return item;
}

module.exports = new FormController();
