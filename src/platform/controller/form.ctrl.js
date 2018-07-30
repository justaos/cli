'use strict';
const PlatformService = require('../service/platform-service');
const moment = require('moment');
const url = require('url');

class FormController {

    listView(req, res, next) {
        let ps = new PlatformService(req.user);
        let pageUrl = new url.URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        ps.getListFormResources(req.params.collection, req.query, function (err, collection, data, fields, listView, listElements) {
            res.render('pages/list/list', {
                collection: collection,
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
        let ps = new PlatformService(req.user);
        let pageUrl = new url.URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        ps.getFormResources(req.params.collection, function (collection, fields, clientScripts,
                                                             formView, formSections, formElements) {

            let record = populateDefaults({}, fields);

            res.render('pages/form/form', {
                collection: {
                    label: collection.label,
                    name: collection.name
                },
                fields: fields,
                item: record,
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
        let ps = new PlatformService(req.user);
        let pageUrl = new url.URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        ps.getFormResources(req.params.collection, function (collection, fields, clientScripts,
                                                             formView, formSections, formElements) {
            ps.findRecordById(req.params.collection, req.params.id).then(function (item) {
                ps.getRelatedLists(req.params.collection, formView.view, item, function (relatedList, relatedListElements) {

                    res.render('pages/form/form', {
                        collection: {
                            label: collection.label,
                            name: collection.name
                        },
                        fields: fields,
                        item: item.toObject(),
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

    formSubmit(req, res) {
        let ps = new PlatformService(req.user);
        if (!req.body.id) {
            ps.createRecord(req.params.collection, req.body).then(function () {
                res.send();
            });
        } else {
            ps.updateRecord(req.params.collection, req.body).then(function () {
                res.send();
            });
        }
    }

    formAction(req, res) {
        let ps = new PlatformService(req.user);
        ps.executeAction(req.params.collection, req.body.items, function (err) {
            if (err)
                res.status(404).render('404');
            else
                res.send();
        });
    }
}

function populateDefaults(item, fields) {
    fields.forEach(function (field) {
        if (!item[field.name]) {
            item[field.name] = field.default_value;
        }
    });
    return item;
}

module.exports = new FormController();
