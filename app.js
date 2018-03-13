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

app.listen(80, function () {
    console.log('Example app listening on port 80!')
});

let db = {};
// dynamically include schemas
fs.readdirSync('./models').forEach(function (file) {
    if (file.substr(-3) === '.js') {
        let model = require('./models/' + file);
        db[model.name] = sequelize.define(model.name, model.schema);
        app.get('/' + model.name + '/list', function (req, res, next) {
            res.render('pages/list', {_layoutFile: path.join(__dirname, '/views/layouts/layout')});
        });
        app.get('/' + model.name + '/new', function (req, res, next) {
            res.send({name: model.name});
        });
    }
});


db.table.sync({force: true}).then(() => {
    // Table created
    return db.table.create({
        name: 'module'
    });
});

db.application.sync({force: true}).then(() => {
    // Table created
    db.application.create({
        name: 'CRM'
    });

    let obj = db.application.create({
        name: 'HRMS'
    });
    obj.then(function (application) {
        db.module.sync({force: true}).then(() => {
            // Table created
            return db.module.create({
                name: 'Employee',
                application: application.id
            });
        });
    });
});


app.get('/application/:id', function (req, res, next) {
    let applicationId = req.params.id;
    let promises = [];
    promises.push(db.application.findById(applicationId));
    promises.push(db.module.findAll({
        where: {application: applicationId},
        order: sequelize.col('order')
    }));
    Promise.all(promises).then(responses => {
        res.render('application', {application: responses[0], modules: responses[1]});
    });
});

app.get('/', function (req, res, next) {
    db.application.findAll({
        order: sequelize.col('order')
    }).then(applications => {
        res.render('index', {applications: applications});
    });
});