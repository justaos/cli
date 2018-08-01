const authenticate = require('../config/authenticate');
const PlatformService = require('./service/platform.service');
const formCtrl = require('./controller/form.ctrl');
const storeCtrl = require('./controller/store.ctrl');

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

    router.get('/store', authenticate, storeCtrl.store);

    router.get('/store/:id', authenticate, storeCtrl.storeApp);

    router.post('/store/:id/install', authenticate, function (req, res) {
        storeCtrl.storeAppInstall(platform, req, res)
    });

    router.get('/menu/:id', authenticate, function (req, res, next) {
        let ps = new PlatformService(req.user);
        ps.getMenuAndModules(req.params.id, function (menu, modules) {
            res.render('pages/menu', {
                menu: menu,
                url: req.query.url,
                modules: modules,
                layout: 'layouts/layout',
                user: req.user
            });
        }).catch(function (err) {
            next(err);
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

    router.get('/p/:collection/list', authenticate, formCtrl.listView);

    router.get('/p/:collection/create', authenticate, formCtrl.createView);

    router.get('/p/:collection/edit/:id', authenticate, formCtrl.editView);

    router.post('/p/:collection', authenticate, formCtrl.formSubmit);

    router.post('/p/:collection/action', authenticate, formCtrl.formAction);

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
