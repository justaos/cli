const express = require('express');
const engine = require('ejs-locals');
const path = require('path');
const Sequelize = require('sequelize');
const glob = require('glob');
var bodyParser = require('body-parser');
const app = express();
const sequelize = new Sequelize('mysql://root:root@127.0.0.1:3306/anysols', {
    define: {
        //prevent sequelize from pluralizing table names
        freezeTableName: true
    }
});

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

app.use('/assets', express.static(path.join(__dirname, '/assets')));
app.use('/views/styles/', express.static(__dirname + '/views/styles'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

app.listen(80, function () {
    console.log('Example app listening on port 80!')
});

let db = {};
db.table = sequelize.define('table', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    name: {
        type: Sequelize.STRING
    },
    label: {
        type: Sequelize.STRING
    }
});

db.column = sequelize.define('column', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    table: {
        type: Sequelize.UUID
    },
    name: {
        type: Sequelize.STRING
    },
    type: {
        type: Sequelize.STRING
    }
});

function dynamicallyIncludeSchema(path) {
    glob.sync(path).forEach(function (file) {
        if (file.substr(-3) === '.js') {
            let table = require(file);
            db[table.name] = sequelize.define(table.name, table.schema);
            db.table.create({
                name: table.name,
                label: table.label
            });
            Object.keys(table.schema).forEach(function (key) {
                db.column.create({
                    name: key,
                    table: table.id,
                    type: table.schema[key].type.key
                });
            });
            db[table.name].sync({force: true});
            app.get('/p/' + table.name + '/list', function (req, res, next) {
                db[table.name].findAll().then(function (data) {
                    res.render('pages/list', {
                        table: {label: table.label, name: table.name},
                        data: data,
                        cols: Object.keys(table.schema),
                        _layoutFile: '../layouts/layout'
                    });
                });
            });
            app.get('/p/' + table.name + '/new', function (req, res, next) {
                res.render('pages/form', {
                    table: {label: table.label, name: table.name},
                    cols: Object.keys(table.schema),
                    _layoutFile: '../layouts/layout'
                });
            });
            app.post('/p/' + table.name + '/new', function (req, res, next) {
                db[table.name].create(req.body).then(function () {
                    res.send({});
                }, function () {
                    res.status(400);
                    res.send({});
                });
            });
        }
    });
}

db.table.sync({force: true}).then(function () {

    db.column.sync({force: true}).then(function () {
        dynamicallyIncludeSchema('./tables/**.js');
        dynamicallyIncludeSchema('./apps/**/tables/**.js');

        db.application.sync({force: true}).then(function () {

            db.table.findAll().then(function (tables) {
                tables.forEach(function (table) {
                    if(table.name !== 'application' && table.name !== 'module')
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


        app.get('/app/:id', function (req, res, next) {
            let applicationId = req.params.id;
            let promises = [];
            promises.push(db.application.findById(applicationId));
            promises.push(db.module.findAll({
                where: {application: applicationId},
                order: sequelize.col('order')
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
            db.application.findById(req.params.id).then(application => {
                res.render('pages/home', {
                    application: application,
                    _layoutFile: '../layouts/layout'
                });
            });
        });

        app.get('/module/:id', function (req, res, next) {
            db.module.findById(req.params.id).then(module => {
                if (module.type === 'list') {
                    res.redirect('/p/' + module.table + '/list');
                } else if (module.type === 'new') {
                    res.redirect('/p/' + module.table + '/new');
                } else
                    res.redirect('/404');
            });
        });

        app.get('/', function (req, res, next) {
            db.application.findAll({
                order: sequelize.col('order')
            }).then(applications => {
                res.render('index', {applications: applications});
            });
        });
        app.get('/signin', function (req, res, next) {
            res.render('signin');
        });
    });
});

function flatToHierarchy(flat) {

    let roots = [];// things without parent

    // make them accessible by guid on this map
    let all = {};

    flat.forEach(function (item) {
        all[item.id] = item
    });

    // connect childrens to its parent, and split roots apart
    Object.keys(all).forEach(function (id) {
        let item = all[id];
        if (item.parent === null) {
            roots.push(item)
        } else if (item.parent in all) {
            let p = all[item.parent];
            if (!('children' in p)) {
                p.children = []
            }
            p.children.push(item)
        }
    });

    // done!
    return roots
}