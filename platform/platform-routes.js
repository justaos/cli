const Sequelize = require('sequelize');
const authenticate = require('../config/authenticate');
const utils = require('../utils');
const Q = require('q');

module.exports = function (database, router, platform) {

	router.get('/', authenticate, function (req, res, next) {
		database.getModel('sys_menu').findAll({
			order: Sequelize.col('order')
		}).then(menus => {
			res.render('index', {menus: menus, _layoutFile: 'layouts/layout'});
		});
	});

	router.get('/dev-tools', authenticate, function (req, res, next) {
		req.url = '/menu/8377670d-c09b-400c-886c-83b9ddc6366d';
		next();
	});

	router.get('/store', authenticate, function (req, res, next) {
		database.getModel('sys_application').findAll({
			order: Sequelize.col('order')
		}).then(applications => {
			res.render('pages/store', {applications: applications, _layoutFile: '../layouts/layout'});
		});
	});

	router.get('/store/:id', authenticate, function (req, res, next) {
		database.getModel('sys_application').findById(req.params.id).then(function (application) {
			res.render('pages/store-app', {application: application, _layoutFile: '../layouts/layout'});
		});
	});

	router.post('/store/:id/install', authenticate, function (req, res, next) {
		platform.installApplication(req.params.id).then(function () {
			res.send({});
		});
	});


	router.get('/menu/:id', authenticate, function (req, res, next) {
		let menuId = req.params.id;
		let promises = [];
		promises.push(database.getModel('sys_menu').findById(menuId));
		promises.push(database.getModel('sys_module').findAll({
			where: {menu: menuId},
			order: [Sequelize.col('order'), Sequelize.col('name')]
		}));
		Q.all(promises).then(function (responses) {
			if (responses[0] && responses[1]) {
				let menu = responses[0];
				let modules = responses[1];
				modules.forEach(function (module) {
					if (module.type === 'list') {
						module.url = '/p/' + module.table + '/list';
					} else if (module.type === 'new') {
						module.url = '/p/' + module.table + '/new';
					}
				});
				modules = utils.flatToHierarchy(modules);
				res.render('pages/menu', {
					menu: menu,
					url: req.query.url,
					modules: modules,
					_layoutFile: '../layouts/layout'
				});
			} else
				res.render('404');
		});
	});

	router.get('/menu/:id/home', authenticate, function (req, res, next) {
		database.getModel('sys_menu').findById(req.params.id).then(menu => {
			res.render('pages/home', {
				menu: menu,
				_layoutFile: '../layouts/layout'
			});
		});
	});

	router.get('/p/:table/list', authenticate, function (req, res, next) {
		let condition = {where: {name: req.params.table}};
		database.getModel('sys_table').findOne(condition).then(function (table) {
			let schema = database.getModel(req.params.table);
			if (schema)
				database.getModel('sys_column').findAll({where: {table: table.id}}).then(function (cols) {
					schema.findAll().then(function (data) {
						res.render('pages/list', {
							table: {label: table.label, name: table.name},
							data: data,
							cols: cols,
							_layoutFile: '../layouts/no-header-layout'
						});
					});
				});
			else
				res.render('404');
		});
	});


	router.get('/p/:table/new', authenticate, function (req, res, next) {
		database.getModel('sys_table').findOne({where: {name: req.params.table}}).then(function (table) {
			let schema = database.getModel(req.params.table);
			if (schema)
				database.getModel('sys_column').findAll({where: {table: table.id}}).then(function (cols) {
					res.render('pages/form', {
						table: {label: table.label, name: table.name},
						cols: cols,
						_layoutFile: '../layouts/no-header-layout'
					});
				});
			else
				res.render('404');
		});
	});

	router.post('/p/:table/new', authenticate, function (req, res, next) {
		database.getModel('sys_table').findOne({where: {name: req.params.table}}).then(function (table) {
			let schema = database.getModel(req.params.table);
			if (schema)
				schema.create(req.body).then(function () {
					res.send({});
				}, function (err) {
					res.status(400);
					res.send(err);
				});
			else
				res.render('404');
		});
	});


	return router;
};