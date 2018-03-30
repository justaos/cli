const express = require('express');
const Sequelize = require('sequelize');
const passport = require('passport');
const router = express.Router();
const config = require('./config/config');
const logger = require('./config/logger');
const authenticate = require('./config/authenticate');
const myUtils = require('./platform/utils');

const app = express();

require('./config/express')(app, router);


//start app on mentioned port
app.listen(config.app.port);

logger.info('listening on port ' + config.app.port);


const Platform = require('./platform/platform');
const platform = new Platform();

platform.loadSchemas(true).then(() => {
    // platform.initializeRoutes(app);
    platform.db.sys_user.create({
       username: 'admin',
       password: myUtils.generateHash('admin')
    });
    require('./config/passport')(app, passport, platform.db.sys_user);
    router.use('/auth', require('./routes/auth'));
});

//platform.installApplication("apps/human-resource-management-system");


router.get('/', authenticate, function (req, res, next) {
    platform.db.sys_application.findAll({
        order: Sequelize.col('order')
    }).then(applications => {
        res.render('index', {applications: applications});
    });
});

app.get('/app/:id', function (req, res, next) {
    let applicationId = req.params.id;
    let promises = [];
    promises.push(platform.db.application.findById(applicationId));
    promises.push(platform.db.module.findAll({
        where: {application: applicationId},
        order: Sequelize.col('order')
    }));
    Promise.all(promises).then(responses => {
        if (responses[0] && responses[0].id) {
            let modules = flatToHierarchy(responses[1]);
            res.render('application', {
                application: responses[0],
                url: req.query.url,
                modules: modules,
                _layoutFile: 'layouts/layout'
            });
        } else
            res.redirect('/');
    });
});

app.get('/app/:id/home', function (req, res, next) {
    platform.db.application.findById(req.params.id).then(application => {
        res.render('pages/home', {
            application: application,
            _layoutFile: '../layouts/layout'
        });
    });
});

app.get('/module/:id', function (req, res, next) {
    platform.db.module.findById(req.params.id).then(module => {
        if (module.type === 'list') {
            res.redirect('/p/' + module.table + '/list');
        } else if (module.type === 'new') {
            res.redirect('/p/' + module.table + '/new');
        } else
            res.redirect('/404');
    });
});


/*

let db = {};

db.table.sync({force: true}).then(function () {

    db.column.sync({force: true}).then(function () {
        dynamicallyIncludeSchema('./tables/!**.js');
        dynamicallyIncludeSchema('./apps/!**!/tables/!**.js');

        db.application.sync({force: true}).then(function () {

            db.table.findAll().then(function (tables) {
                tables.forEach(function (table) {
                    if (table.name !== 'application' && table.name !== 'module')
                        db.application.create({
                            name: table.label
                        }).then(function (application) {
                            db.module.create({
                                name: table.label,
                                application: application.id
                            }).then(function (parent) {
                                db.module.create({
                                    name: 'Create',
                                    parent: parent.id,
                                    type: 'new',
                                    table: table.name,
                                    application: application.id
                                });
                                db.module.create({
                                    name: 'All',
                                    parent: parent.id,
                                    type: 'list',
                                    table: table.name,
                                    application: application.id
                                })
                            });
                        });
                });
            });
        });


    });
});

*/
