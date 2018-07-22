const authenticate = require('../config/authenticate');
const Q = require('q');
const PlatformService = require('./service/platform-service');
const storeController = require('./controller/store.ctrl');
const moment = require('moment');

module.exports = function (platform) {

    let router = platform.router;

    router.get('/', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getMenus(menus => {
            res.render('index', {menus: menus, layout: 'layouts/layout', user: req.user});
        });
    });

    router.get('/profile', authenticate, function (req, res) {
        res.redirect('/no-menu?url=/p/p_user/edit/' + req.user.id);
    });

    router.get('/dev-tools', authenticate, function (req, res, next) {
        req.url = '/menu/5b15588ef362641220dfebc1';
        next();
    });

    router.get('/store', authenticate, storeController.store);

    router.get('/store/:id', authenticate, storeController.storeApp);

    router.post('/store/:id/install', authenticate, function (req, res) {
        storeController.storeAppInstall(platform, req, res)
    });

    router.get('/menu/:id', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getMenuAndModules(req.params.id, function (menu, modules) {
            if (menu)
                res.render('pages/menu', {
                    menu: menu,
                    url: req.query.url,
                    modules: modules,
                    layout: 'layouts/layout',
                    user: req.user
                });
            else
                res.render('404');
        });
    });

    router.get('/no-menu', authenticate, function (req, res) {
        res.render('pages/menu', {
            menu: undefined,
            url: req.query.url,
            layout: 'layouts/layout',
            user: req.user
        });
    });

    router.get('/menu/:id/home', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getMenuById(req.params.id, menu => {
            res.render('pages/home', {
                menu: menu,
                layout: 'layouts/layout',
                user: req.user
            });
        });
    });

    router.get('/p/:collection/list', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getListFormResources(req.params.collection, req.query, function (collection, data, fields, listView, listElements) {
            res.render('pages/list/list', {
                collection: collection,
                data: data,
                fields: fields,

                listView: listView,
                listElements: listElements,

                moment: moment,
                layout: 'layouts/no-header-layout',
                user: req.user
            });
        }, function () {
            res.render('404');
        });
    });


    router.get('/p/:collection/new', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getFormResources(req.params.collection, function (collection, fields, clientScripts, formView,
                                                             formSections, formElements) {
            res.render('pages/form/form', {
                collection: {
                    label: collection.label,
                    name: collection.name
                },
                fields: fields,
                item: {},
                clientScripts: clientScripts,

                formView: formView,
                formSections: formSections,
                formElements: formElements,

                moment: moment,

                user: req.user,

                layout: 'layouts/no-header-layout'
            });
        });
    });

    router.get('/p/:collection/edit/:id', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getFormResources(req.params.collection, function (collection, fields, clientScripts, formView, formSections, formElements) {
            ps.findRecordById(req.params.collection, req.params.id).then(function (item) {
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

                    moment: moment,

                    user: req.user,

                    layout: 'layouts/no-header-layout'
                });
            });
        });
    });

    router.post('/p/:collection', authenticate, function (req, res) {
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
    });

    router.post('/p/:collection/action', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.executeAction(req.params.collection, req.body.items, function (err) {
            if (err)
                res.status(404).render('404');
            else
                res.send();
        });
    });

    router.post('/p/:collection/search', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.fieldSearch(req.body.q, req.params.collection, req.body.field).then(function (data) {
            res.send(data);
        });

    });

    router.get('/p/:collection/export', authenticate, function (req, res) {
        let result = {
            collection: req.params.collection
        };
        let ps = new PlatformService(req.user);
        ps.getRecords(req.params.collection, req.query.records).then(function (records) {
            result.records = records.map(rec => {
                rec = rec.toObject();
                delete rec._id;
                delete rec.__v;
                return rec;
            });
            res.send(result);
        });
    });

    router.get('/p/api/update', authenticate, function (req, res) {
        PlatformService.loadPlatformUpdates();
        res.send();
    });

    router.all('/api/*', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.executeRestApi(req, res, () => {
            res.status(404).render('404');
        });
    });

    return router;

};
/*
  const url = require('url');
  let referer = req.header('Referer');
  let refererUrl = new url.URL(referer);
  console.log(refererUrl.searchParams.get('test'));
  */
