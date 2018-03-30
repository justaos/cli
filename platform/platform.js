'use strict';
const fs = require('fs');
const glob = require('glob');
const Sequelize = require('sequelize');
const Q = require('q');

const sequelize = new Sequelize('anysols', 'root', 'root', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        //prevent sequelize from pluralizing table namesN
        freezeTableName: true
    },
    operatorsAliases: false
});

let application = {};
let db = {};

class Platform {
    constructor() {
        this.db = db;
    }

    installApplication(path) {
        console.log('*********************** STARTED INSTALLING - ' + path + ' ***********************');
        let config;
        try {
            config = fs.readFileSync(path + '/config.json');
            config = JSON.parse(config);
        } catch (e) {
            console.log('Installation failed.');
        }
        console.log('*********************** END LOADING - ' + path + ' ***********************');
    }

    loadSchemas(createTables) {
        let that = this;
        let promises = [];
        promises.push(that.loadSchemasFrom('platform/models/**.js', createTables));
        promises.push(that.loadSchemasFrom('apps/**/tables/**.js', createTables));
        return Q.all(promises);
    }

    loadSchemasFrom(path, createTables) {
        let promises = [];
        glob.sync(path).forEach(function (file) {
            if (file.substr(-3) === '.js') {
                let dfd = Q.defer();
                promises.push(dfd.promise);
                let table = require('../' + file);
                db[table.name] = sequelize.define(table.name, table.schema);
                if (createTables) {
                    db[table.name].sync({force: true}).then(function () {
                        db.sys_table.create({
                            name: table.name,
                            label: table.label
                        }).then(function () {
                            dfd.resolve();
                        });
                        Object.keys(table.schema).forEach(function (key) {
                            db.sys_column.create({
                                name: key,
                                table: table.id,
                                type: table.schema[key].type.key
                            });
                        });
                    });
                } else
                    dfd.resolve();
            }
        });
        return Q.all(promises);
    }

    initializeRoutes(app) {
        let that = this;
        db.sys_table.findAll().then(function (tables) {
            tables.forEach(function (table) {
                that.bindPlatformView(app, table);
            });
        });
    }

    bindPlatformView(app, table) {
        app.get('/p/' + table.name + '/list', this.createListView(table));
        app.get('/p/' + table.name + '/new', this.createFormView(table));
        app.post('/p/' + table.name + '/new', function (req, res, next) {
            db[table.name].create(req.body).then(function () {
                res.send({});
            }, function () {
                res.status(400);
                res.send({});
            });
        });
    }

    createListView(table) {
        return function (req, res, next) {
            db[table.name].findAll().then(function (data) {
                res.render('pages/list', {
                    table: {label: table.label, name: table.name},
                    data: data,
                    cols: ['name'],
                    _layoutFile: '../layouts/layout'
                });
            });
        }
    }

    createFormView(table) {
        return function (req, res, next) {
            res.render('pages/form', {
                table: {label: table.label, name: table.name},
                cols: ['name'],
                _layoutFile: '../layouts/layout'
            });
        };
    }

    scanApplications() {

    }
}

module.exports = Platform;