'use strict';
const fs = require('fs');
const glob = require('glob');
const Q = require('q');
const path = require('path');
const platformUtils = require('./platform-utils');
const platformRoutes = require('./platform-routes');
const config = require('../config/config');
const logger = require('../config/logger');
const utils = require('../utils');

module.exports = function (database, router) {
	class Platform {
		constructor() {
			this.appStarting = true;
		}

		boot() {
			let dfd = Q.defer();
			let that = this;
			logger.log('BOOT:: start');
			database.createDatabase().then(function () {
				database.connect();
				let sequelize = database.getConnection();
				let modelPath = 'platform/models/**.json';
				that.createPlatformTables(sequelize, modelPath).then(function () {
					let promises = [];
					glob.sync(modelPath).forEach(function (file) {
						let tableJson = utils.getObjectFromFile(file);
						promises.push(that.populateSysData(tableJson));

					});
					Q.all(promises).then(function () {
						dfd.resolve();
					});
				});
				logger.log('BOOT:: end');
			});
			return dfd.promise;
		}


		upsert(model, values, condition) {
			return model.findOne({where: condition}).then(function (obj) {
				if (obj) // update
					return obj.update(values);
				else  // insert
					return model.create(values);
			});
		}

		populateSysData(tableJson) {
			let that = this;
			let dfd = Q.defer();
			database.getModel('sys_table').create({
				name: tableJson.name,
				label: tableJson.label
			}).then(function (tableRecord) {
				let promises = [];
				tableJson.columns.forEach(function (col) {
					let label = utils.underscoreToCamelCase(col.name);
					promises.push(database.getModel('sys_column').create({
						name: col.name,
						label: col.label ? col.label : label,
						type: col.type,
						table: tableRecord.id
					}));
				});
				Q.all(promises).then(function () {
					dfd.resolve();
				})
			});
			return dfd.promise;
		}

		createPlatformTables(sequelize, path) {
			let promises = [];
			glob.sync(path).forEach(function (file) {
				let tableJson = utils.getObjectFromFile(file);
				let tableSchemaDef = platformUtils.convertToScheme(tableJson);
				let tableSchema = sequelize.define(tableJson.name, tableSchemaDef);
				database.setModel(tableJson.name, tableSchema);
				promises.push(tableSchema.sync({force: true}));
			});
			return Q.all(promises);
		}

		startUp() {
			let that = this;
			that.loadSchemas();
			that.scanApplications();
			platformRoutes(database, router, this);
			return database.getModel('sys_user').create({
				username: 'admin',
				password: utils.generateHash('admin')
			});
		}

		installApplication(appId) {
			let that = this;
			let dfd = Q.defer();
			logger.info('STARTED INSTALLING');
			database.getModel('sys_application').findById(appId).then(function (application) {
				//let config = utils.getObjectFromFile('apps/'+application.package+'/config.json');
				that.loadSchemasFromPath('apps/' + application.package + '/models/**.json', true);
				that.loadData('apps/' + application.package + '/update/**.json');
				application.updateAttributes({installed_version: application.version}).then(function () {
					dfd.resolve();
				});
				console.log(config);
			});
			return dfd.promise;
		}

		loadSchemas() {
			let that = this;
			that.loadSchemasFromPath('platform/models/**.json', true);
			//promises.push(that.loadSchemasFrom('platform/models/**.js', createTables));
			//promises.push(that.loadSchemasFrom('apps/**/tables/**.js', createTables));
		}

		loadData(path) {
			let that = this;
			glob.sync(path).forEach(function (file) {
				let data = utils.getObjectFromFile(file);
				that.upsert(database.getModel(data.table), data.record, {id: data.record.id});
			});
		}

		loadSchemasFromPath(path, alter) {
			let sequelize = database.getConnection();
			glob.sync(path).forEach(function (file) {
				let tableJson = utils.getObjectFromFile(file);
				let tableSchemaDef = platformUtils.convertToScheme(tableJson);
				database.setModel(tableJson.name, sequelize.define(tableJson.name, tableSchemaDef));
				if (alter)
					database.getModel(tableJson.name).sync({alter: true});
			});
		}

		loadSchemasFrom(path, createTables) {
			let promises = [];
			glob.sync(path).forEach(function (file) {
				if (file.substr(-3) === '.js') {
					let dfd = Q.defer();
					promises.push(dfd.promise);
					let table = require('../' + file);
					database.setModel(table.name, database.getConnection().define(table.name, table.schema));
					if (createTables) {
						database.getModel(table.name).sync({force: true}).then(function () {
							database.getModel('sys_table').create({
								name: table.name,
								label: table.label
							}).then(function () {
								dfd.resolve();
							});
							Object.keys(table.schema).forEach(function (key) {
								database.getModel('sys_column').create({
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

		initializeRoutes() {
			let that = this;

			/*db.sys_table.findAll().then(function (tables) {
				tables.forEach(function (table) {
					that.bindPlatformView(app, table);
				});
			});*/
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
			logger.info('Scanning for apps');
			let that = this;
			glob.sync('apps/**/config.json').forEach(function (file) {
				let config = utils.getObjectFromFile(file);
				that.upsert(database.getModel('sys_application'), config, {package: config.package});
			});
		}
	}

	return new Platform();
};