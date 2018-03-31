'use strict';
const fs = require('fs');
const glob = require('glob');
const Q = require('q');
const config = require('../config/config');
const logger = require('../config/logger');
const utils = require('../utils');
const platformUtils = require('./platform-utils');
const path = require('path');

let application = {};
let db = {};


module.exports = function (database, router) {
	class Platform {
		constructor() {
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
					glob.sync(modelPath).forEach(function (file) {
						if (file.substr(-5) === '.json') {
							let tableJson = utils.getObjectFromFile(file);
							that.populateSysData(tableJson);
						}
					});
					dfd.resolve();//TODO: consider populateSysData
				});
				logger.log('BOOT:: end');
			});
			return dfd.promise;
		}

		camelCase(input) {
			input = input.charAt(0).toUpperCase() + input.substr(1);
			return input.replace(/_(.)/g, function (match, letter) {
				return ' ' + letter.toUpperCase();
			});
		}

		populateSysData(tableJson) {
			let that = this;
			db.sys_table.create({
				name: tableJson.name,
				label: tableJson.label
			}).then(function (tableRecord) {
				tableJson.columns.forEach(function (col) {
					let label = that.camelCase(col.name);
					db.sys_column.create({
						name: col.name,
						label: col.label ? col.label : label,
						type: col.type,
						table: tableRecord.id
					});
				})
			});
		}

		createPlatformTables(sequelize, path) {
			let promises = [];
			glob.sync(path).forEach(function (file) {
				let tableJson = utils.getObjectFromFile(file);
				let tableSchemaDef = platformUtils.convertToScheme(tableJson);
				let tableSchema = sequelize.define(tableJson.name, tableSchemaDef);
				db[tableJson.name] = tableSchema;
				promises.push(tableSchema.sync({force: true}));
			});
			return Q.all(promises);
		}

		startUp() {
			let that = this;
			that.loadSchemas();
			// platform.initializeRoutes(app);
			database.setModels(db);
			return db.sys_user.create({
				username: 'admin',
				password: utils.generateHash('admin')
			});
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

		loadSchemas() {
			let that = this;
			that.loadSchemasFromPath('platform/models/**.json');
			//promises.push(that.loadSchemasFrom('platform/models/**.js', createTables));
			//promises.push(that.loadSchemasFrom('apps/**/tables/**.js', createTables));
		}

		loadSchemasFromPath(path) {
			let sequelize = database.getConnection();
			glob.sync(path).forEach(function (file) {
				let tableJson = utils.getObjectFromFile(file);
				let tableSchemaDef = platformUtils.convertToScheme(tableJson);
				db[tableJson.name] = sequelize.define(tableJson.name, tableSchemaDef);
			});
		}

		loadSchemasFrom(path, createTables) {
			let promises = [];
			glob.sync(path).forEach(function (file) {
				if (file.substr(-3) === '.js') {
					let dfd = Q.defer();
					promises.push(dfd.promise);
					let table = require('../' + file);
					db[table.name] = database.getConnection().define(table.name, table.schema);
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

	return new Platform();
};