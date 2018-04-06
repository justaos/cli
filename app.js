const express = require('express');
const passport = require('passport');
const router = express.Router();
const config = require('./config/config');
const logger = require('./config/logger');
const myUtils = require('./utils');

const app = express();

require('./config/express')(app, router);

const database = require('./config/database')();
database.connect();
const platform = require('./platform/platform')(database, router);

database.validateConnection().then(startUp, function () {
	platform.boot().then(function () {
		startUp();
	});
});

function startUp() {
	platform.startUp().then(function () {
		require('./config/passport')(app, passport, database.getModel('sys_user'));
		router.use('/auth', require('./routes/auth'));
		platform.appStarting = false;
	});
}

//start app on mentioned port
app.listen(config.app.port);

logger.info('listening on port ' + config.app.port);


/*
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