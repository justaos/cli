const Sequelize = require('sequelize');
const authenticate = require('../config/authenticate');
const utils = require('../utils');

module.exports = function (database, router, platform) {

	router.get('/', authenticate, function (req, res, next) {
		database.getModel('sys_menu').findAll({
			order: Sequelize.col('order')
		}).then(menus => {
			res.render('index', {menus: menus, _layoutFile: 'layouts/layout'});
		});
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
		platform.installApplication(req.params.id).then(function(){
			res.send({});
		});
	});


	router.get('/menu/:id', authenticate, function (req, res, next) {
		let menuId = req.params.id;
		let promises = [];
		promises.push(database.getModel('sys_menu').findById(menuId));
		promises.push(database.getModel('sys_module').findAll({
			where: {menu: menuId},
			order: Sequelize.col('order')
		}));
		Promise.all(promises).then(responses => {
			if (responses[0] && responses[0].id) {
				let modules = utils.flatToHierarchy(responses[1]);
				res.render('pages/menu', {
					application: responses[0],
					url: req.query.url,
					modules: modules,
					_layoutFile: '../layouts/layout'
				});
			} else
				res.redirect('/');
		});
	});

	router.get('/app/:id/home', function (req, res, next) {
		database.getModel('sys_application').findById(req.params.id).then(application => {
			res.render('pages/home', {
				application: application,
				_layoutFile: '../layouts/layout'
			});
		});
	});

	router.get('/module/:id', function (req, res, next) {
		database.getModel('sys_module').findById(req.params.id).then(module => {
			if (module.type === 'list') {
				res.redirect('/p/' + module.table + '/list');
			} else if (module.type === 'new') {
				res.redirect('/p/' + module.table + '/new');
			} else
				res.redirect('/404');
		});
	});

	return router;
};