const authenticate = require('../config/authenticate');
const hashUtils = require('../utils/hash-utils');
const Q = require('q');
const PlatformService = require('./service/platform-service');
const storeController = require('./controller/store.ctrl');
const moment = require('moment');

module.exports = function (platform) {

    let router = platform.router;

    router.get('/', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        console.log(req.user.hasRole('admin'));
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
        ps.getListFormData(req.params.collection, req.query, function (collection, data, fields) {
            res.render('pages/list/list', {
                collection: collection,
                data: data,
                fields: fields,
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

        ps.getCollectionByName(req.params.collection).then(function (collection) {
            ps.getFieldsForCollection(collection.name).then(function (fields) {
                fields = fields.map(model => model.toObject());

                ps.populateOptions(fields, collection.name).then(function () {
                    res.render('pages/form/form', {
                        collection: {
                            label: collection.label,
                            name: collection.name
                        },
                        fields: fields,
                        item: {},
                        moment: moment,
                        layout: 'layouts/no-header-layout',
                        user: req.user
                    });
                });
            });
        });
    });

    router.get('/p/:collection/edit/:id', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getCollectionByName(req.params.collection).then(function (collection) {
            let promises = [];
            promises.push(ps.getFieldsForCollection(collection.name));
            promises.push(ps.findRecordById(req.params.collection, req.params.id));
            Q.all(promises).then(function (result) {
                let fields = result[0].map(model => model.toObject());
                ps.populateOptions(fields, collection.name).then(function () {
                    res.render('pages/form/form', {
                        collection: {
                            label: collection.label,
                            name: collection.name
                        },
                        fields: fields,
                        item: result[1].toObject(),
                        layout: 'layouts/no-header-layout',
                        moment: moment,
                        user: req.user
                    });
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

    router.post('/search', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.fieldSearch(req.body.q, req.body.collection, req.body.field).then(function (data) {
            res.send(data);
        });

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
