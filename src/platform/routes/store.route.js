'use strict';
const authenticate = require('../../config/authenticate');
const PlatformService = require('./../service/platform-service');

class StoreController {
    store(req, res) {
        let ps = new PlatformService(req.user);
        ps.getApplications(applications => {
            res.render('pages/store',
                {applications: applications, layout: 'layouts/layout', user: req.user});
        });
    }

    storeApp(req, res) {
        let ps = new PlatformService(req.user);
        ps.getApplicationById(req.params.id, function (application) {
            res.render('pages/store-app',
                {application: application, layout: 'layouts/layout', user: req.user});
        });
    }

    storeAppInstall(platform, req, res) {
        platform.installApplication(req.params.id, req.body.sample).then(function () {
            res.send({});
        });
    }
}

module.exports = new StoreController();
