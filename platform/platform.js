'use strict';
const glob = require('glob');
const Q = require('q');
const platformUtils = require('./platform-utils');
const platformRoutes = require('./platform-routes');
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

		createColumn(col, tableId) {
			return database.getModel('sys_column').create({
				name: col.name,
				label: col.label ? col.label : utils.underscoreToCamelCase(col.name),
				type: col.type,
				table: tableId
			});
		}

		populateSysData(tableJson) {
			let that = this;
			let dfd = Q.defer();
			database.getModel('sys_table').findOne({where: {name: tableJson.name}}).then(function (table) {
				if (!table)
					database.getModel('sys_table').create({
						name: tableJson.name,
						label: tableJson.label
					}).then(function (tableRecord) {
						let promises = [];
						tableJson.columns.forEach(function (col) {
							promises.push(that.createColumn(col, tableRecord.id));
						});
						Q.all(promises).then(function () {
							dfd.resolve();
						})
					});
				else {
					database.getModel('sys_column').destroy({
						where: {
							table: table.id
						}
					}).then(function (columns) {
						let promises = [];
						tableJson.columns.forEach(function (col) {
							promises.push(that.createColumn(col, table.id));
						});
						Q.all(promises).then(function () {
							dfd.resolve();
						})
					});
				}
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
			let dfd = Q.defer();
			that.loadSchemas().then(function () {
				that.scanApplications();
				platformRoutes(database, router, that);
				database.getModel('sys_user').create({
					username: 'admin',
					password: utils.generateHash('admin')
				}).then(function () {
					dfd.resolve();
				});
			});

			return dfd.promise;
		}

		installApplication(appId) {
			let that = this;
			let dfd = Q.defer();
			logger.info('STARTED INSTALLING');
			database.getModel('sys_application').findById(appId).then(function (application) {
				let modelPath = 'apps/' + application.package + '/models/**.json';
				that.loadSchemasFromPath(modelPath, true);
				that.loadData('apps/' + application.package + '/update/**.json');
				let promises = [];
				glob.sync(modelPath).forEach(function (file) {
					let tableJson = utils.getObjectFromFile(file);
					promises.push(that.populateSysData(tableJson));
				});
				promises.push(application.updateAttributes({installed_version: application.version}));
				Q.all(promises).then(function () {
					dfd.resolve();
				});
			});
			return dfd.promise;
		}

		loadSchemas() {
			let that = this;
			that.loadSchemasFromPath('platform/models/**.json', true);
			return that.loadSchemasFromDB();
		}

		loadData(path) {
			glob.sync(path).forEach(function (file) {
				let data = utils.getObjectFromFile(file);
				platformUtils.upsert(database.getModel(data.table), data.record, {id: data.record.id});
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

		loadSchemasFromDB() {
			let dfd = Q.defer();
			database.getModel('sys_table').findAll().then(function (tables) {
				if (tables.length) {
					let promises = [];
					tables.forEach(function (table) {
						if (!database.getModel(table.name)) {
							let tableJson = {
								'name': table.name,
								'label': table.label,
								'columns': []
							};
							let colDfd = Q.defer();
							database.getModel('sys_column').findAll({where: {table: table.id}}).then(function (columns) {
								columns.forEach(function (col) {
									tableJson.columns.push({
										name: col.name,
										type: col.type
									})
								});
								let tableSchemaDef = platformUtils.convertToScheme(tableJson);
								database.setModel(tableJson.name, database.getConnection().define(tableJson.name, tableSchemaDef));
								colDfd.resolve();
							});
							promises.push(colDfd.promise);
						}
					});
					Q.all(promises).then(function () {
						dfd.resolve();
					})
				}
				else
					dfd.resolve();
			});
			return dfd.promise;
		}

		scanApplications() {
			logger.info('Scanning for apps');
			glob.sync('apps/**/config.json').forEach(function (file) {
				let config = utils.getObjectFromFile(file);
				platformUtils.upsert(database.getModel('sys_application'), config, {package: config.package});
			});
		}
	}

	return new Platform();
};