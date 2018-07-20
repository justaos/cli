'use strict';
const StoreService = require('../service/store.service');

class StoreController {
    store(req, res) {
        let ss = new StoreService(req.user);
        ss.getApplications(applications => {
            res.render('pages/store',
                {applications: applications, layout: 'layouts/layout', user: req.user});
        });
    }

    storeApp(req, res) {
        let ss = new StoreService(req.user);
        ss.getApplicationById(req.params.id, function (application) {
            res.render('pages/store-app',
                {application: application, layout: 'layouts/layout', user: req.user});
        });
    }

    storeAppInstall(platform, req, res) {
        let ss = new StoreService(req.user);
        ss.installApplication(req.params.id, req.body.sample, platform).then(function () {
            res.send({});
        });
    }
}

module.exports = new StoreController();
