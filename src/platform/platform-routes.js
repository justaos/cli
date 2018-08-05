const authenticate = require('../config/authenticate');
const PlatformService = require('./service/platform.service');
const formCtrl = require('./controller/form.ctrl');
const storeCtrl = require('./controller/store.ctrl');
const menuCtrl = require('./controller/menu.ctrl');

module.exports = function (platform) {

    let router = platform.router;

    router.get('/', authenticate, menuCtrl.getMenus);
    router.get('/menu/:id', authenticate, menuCtrl.getMenuAndModules);
    router.get('/menu/:id/home', authenticate, menuCtrl.getMenuHome);
    router.get('/no-menu', authenticate, function (req, res) {
        res.render('pages/menu', {
            menu: undefined,
            url: req.query.url,
            layout: 'layouts/layout',
            user: req.user
        });
    });


    router.get('/profile', authenticate, function (req, res) {
        res.redirect('/no-menu?url=/p/p_user/edit/' + req.user.id);
    });
    router.get('/dev-tools', authenticate, function (req, res, next) {
        res.redirect('/menu/5b15588ef362641220dfebc1');
    });

    router.get('/store', authenticate, storeCtrl.store);
    router.get('/store/:id', authenticate, storeCtrl.storeApp);
    router.post('/store/:id/install', authenticate, function (req, res) {
        storeCtrl.storeAppInstall(platform, req, res)
    });


    router.get('/p/:collection/list', authenticate, formCtrl.listView);
    router.get('/p/:collection/create', authenticate, formCtrl.createView);
    router.get('/p/:collection/edit/:id', authenticate, formCtrl.editView);
    router.post('/p/:collection', authenticate, formCtrl.formSubmit);
    router.post('/p/:collection/action', authenticate, formCtrl.formAction);
    router.post('/p/:collection/search', authenticate, formCtrl.fieldSearch);
    router.get('/p/:collection/export', authenticate, formCtrl.exportRecords);

    router.get('/p/api/update', authenticate, function (req, res) {
        PlatformService.loadPlatformUpdates();
        res.send();
    });

    router.all('/api/*', authenticate, function (req, res, next) {
        let ps = new PlatformService(req.user);
        ps.executeRestApi(req, res, next).catch((err) => {
            next(err);
        });
    });

    return router;

};
