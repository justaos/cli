const express = require('express');
const engine = require('ejs-locals');
const path = require('path');
const Sequelize = require('sequelize');
fs = require('fs');
const app = express();
const sequelize = new Sequelize('mysql://root:root@localhost:3306/anysols', {
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
    }
});

db.table.sync({force: true}).then(function(){
    // dynamically include schemas
    fs.readdirSync('./tables').forEach(function (file) {
        if (file.substr(-3) === '.js') {
            let table = require('./tables/' + file);
            db[table.name] = sequelize.define(table.name, table.schema);
            db.table.create({
                name: table.name,
                label: table.label
            });
            app.get('/p/' + table.name + '/list', function (req, res, next) {
                res.render('pages/list', {title: table.label, _layoutFile: '/layouts/layout'});
            });
            app.get('/p/' + table.name + '/new', function (req, res, next) {
                res.render('pages/form', {title: table.label, _layoutFile: '/layouts/layout'});
            });
        }
    });

    db.application.sync({force: true}).then(() => {
        // Table created
        db.application.create({
            name: 'ITSM'
        }).then(function (application) {
            db.module.sync({force: true}).then(() => {
                // Table created
                db.module.create({
                    name: 'Incident',
                    application: application.id
                }).then(function (parent) {
                    db.module.create({
                        name: 'Create',
                        parent: parent.id,
                        type: 'new',
                        table: 'incident',
                        application: application.id
                    });
                    db.module.create({
                        name: 'All',
                        parent: parent.id,
                        type: 'list',
                        table: 'incident',
                        application: application.id
                    })
                });
            });
        });

        db.application.create({
            name: 'HRMS'
        }).then(function (application) {
            db.module.sync({force: true}).then(() => {
                // Table created
                db.module.create({
                    name: 'Employee',
                    application: application.id
                }).then(function (parent) {
                    db.module.create({
                        name: 'All',
                        parent: parent.id,
                        type: 'list',
                        table: 'employee',
                        application: application.id
                    });
                    db.module.create({
                        name: 'Create',
                        parent: parent.id,
                        type: 'new',
                        table: 'employee',
                        application: application.id
                    })
                });

                db.module.create({
                    name: 'Leave',
                    type: 'new',
                    table: 'leave',
                    application: application.id
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
            if(responses[0] && responses[0].id){
                let modules = flatToHierarchy(responses[1]);
                res.render('application', {
                    application: responses[0],
                    modules: modules,
                    _layoutFile: '/layouts/layout'
                });
            } else
                res.redirect('/');
        });
    });

    app.get('/app/:id/home', function (req, res, next) {
        db.application.findById(req.params.id).then(application => {
            res.render('pages/home', {
                application: application,
                _layoutFile: '/layouts/layout'
            });
        });
    });

    app.get('/module/:id', function (req, res, next) {
        db.module.findById(req.params.id).then(module => {
            if (module.type === 'list') {
                res.redirect('/p/' + module.table + '/list');
            } else if(module.type === 'new'){
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