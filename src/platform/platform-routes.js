const authenticate = require('../config/authenticate');
const hashUtils = require('../utils/hash-utils');
const Q = require('q');
const PlatformService = require('./service/platform-service');
const storeController = require('./routes/store.route');

module.exports = function (platform) {

    let router = platform.router;

    router.get('/', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getMenus(menus => {
            res.render('index', {menus: menus, layout: 'layouts/layout'});
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
                    layout: 'layouts/layout'
                });
            else
                res.render('404');
        });
    });

    router.get('/no-menu', authenticate, function (req, res) {
        res.render('pages/menu', {
            menu: undefined,
            url: req.query.url,
            layout: 'layouts/layout'
        });
    });

    router.get('/menu/:id/home', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getMenuById(req.params.id, menu => {
            res.render('pages/home', {
                menu: menu,
                layout: 'layouts/layout'
            });
        });
    });

    router.get('/p/:collection/list', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getListFormData(req.params.collection, req.query, function (collection, data, fields) {
            res.render('pages/list', {
                collection: collection,
                data: data,
                cols: fields,
                layout: 'layouts/no-header-layout'
            });
        }, function () {
            res.render('404');
        });
    });

    router.get('/p/:collection/new', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);

        ps.getCollectionByName(req.params.collection).then(function (collection) {
            ps.getFieldsForCollection(collection.id).then(function (cols) {
                cols = cols.map(model => model.toObject());
                ps.populateOptions(cols, collection.id).then(function () {
                    res.render('pages/form', {
                        collection: {
                            label: collection.label,
                            name: collection.name
                        },
                        cols: cols,
                        item: {},
                        layout: 'layouts/no-header-layout'
                    });
                });
            });
        });
    });

    router.get('/p/:collection/edit/:id', authenticate, function (req, res) {
        let ps = new PlatformService(req.user);
        ps.getCollectionByName(req.params.collection).then(function (collection) {
            let promises = [];
            promises.push(ps.getFieldsForCollection(collection.id));
            promises.push(ps.findRecordById(req.params.collection, req.params.id));
            Q.all(promises).then(function (result) {
                let cols = result[0].map(model => model.toObject());
                ps.populateOptions(cols, collection.id).then(function () {
                    res.render('pages/form', {
                        collection: {
                            label: collection.label,
                            name: collection.name
                        },
                        cols: cols,
                        item: result[1].toObject(),
                        layout: 'layouts/no-header-layout'
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
