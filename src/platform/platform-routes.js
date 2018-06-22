const authenticate = require('../config/authenticate');
const dsUtils = require('../utils/ds-utils');
const Q = require('q');
const Model = require('../model');
const url = require('url');
const vm = require('vm');

module.exports = function(platform) {

  let router = platform.router;

  router.get('/', authenticate, function(req, res) {
    new Model('p_menu').find({}).then(menus => {
      res.render('index', {menus: menus, layout: 'layouts/layout'});
    });
  });

  router.get('/dev-tools', authenticate, function(req, res, next) {
    req.url = '/menu/5b15588ef362641220dfebc1';
    next();
  });

  router.get('/store', authenticate, function(req, res) {
    new Model('p_application').find({}).then(applications => { //order: Sequelize.col('order')
      res.render('pages/store',
          {applications: applications, layout: 'layouts/layout'});
    });
  });

  router.get('/store/:id', authenticate, function(req, res) {
    new Model('p_application').findById(req.params.id).
        then(function(application) {
          res.render('pages/store-app',
              {application: application, layout: 'layouts/layout'});
        });
  });

  router.post('/store/:id/install', authenticate, function(req, res) {
    platform.installApplication(req.params.id).then(function() {
      res.send({});
    });
  });

  router.get('/menu/:id', authenticate, function(req, res) {
    let menuId = req.params.id;
    let promises = [];
    promises.push(new Model('p_menu').findById(menuId));
    promises.push(new Model('p_module').find({menu: menuId})); // order: [Sequelize.col('order'), Sequelize.col('name')]

    Q.all(promises).then(function(responses) {
      if (responses[0] && responses[1]) {
        let menu = responses[0];
        let modules = responses[1];
        modules = modules.map(function(module) {
          return module.toObject();
        });
        modules.forEach(function(module) {
          if (module.type === 'list') {
            module.url = '/p/' + module.table + '/list';
          } else if (module.type === 'new') {
            module.url = '/p/' + module.table + '/new';
          }
        });
        modules = dsUtils.flatToHierarchy(modules);
        res.render('pages/menu', {
          menu: menu,
          url: req.query.url,
          modules: modules,
          layout: 'layouts/layout'
        });
      } else
        res.render('404');
    });
  });

  router.get('/menu/:id/home', authenticate, function(req, res) {
    new Model('p_menu').findById(req.params.id).then(menu => {
      res.render('pages/home', {
        menu: menu,
        layout: 'layouts/layout'
      });
    });
  });

  router.get('/p/:collection/list', authenticate, function(req, res) {
    new Model('p_collection').findOne({name: req.params.collection}).
        then(function(collection) {
          let schema = new Model(req.params.collection);
          if (schema)
            new Model('p_field').find({table: collection.id}).
                then(function(cols) {
                  schema.find({}).then(function(data) {
                    res.render('pages/list', {
                      table: {label: collection.label, name: collection.name},
                      data: data,
                      cols: cols,
                      layout: 'layouts/no-header-layout'
                    });
                  });
                });
          else
            res.render('404');
        });
  });

  router.get('/p/:collection/new', authenticate, function(req, res) {
    new Model('p_collection').findOne({name: req.params.collection}).
        then(function(collection) {
          let schema = new Model(req.params.collection);
          if (schema)
            new Model('p_field').find({table: collection.id}).
                then(function(cols) {
                  res.render('pages/form', {
                    table: {label: collection.label, name: collection.name},
                    cols: cols,
                    item: {},
                    layout: 'layouts/no-header-layout'
                  });
                });
          else
            res.render('404');
        });
  });

  router.get('/p/:collection/edit/:id', authenticate, function(req, res) {
    new Model('p_collection').findOne({name: req.params.collection}).
        then(function(collection) {
          let schema = new Model(req.params.collection);
          if (schema) {
            let promises = [];
            promises.push(new Model('p_field').find({table: collection.id}));
            promises.push(schema.findById(req.params.id));
            Q.all(promises).
                then(function(result) {
                  res.render('pages/form', {
                    table: {label: collection.label, name: collection.name},
                    cols: result[0],
                    item: result[1].toObject(),
                    layout: 'layouts/no-header-layout'
                  });
                });
          }
          else
            res.render('404');
        });
  });

  router.post('/p/:table', authenticate, function(req, res) {
    let schema = new Model(req.params.table);
    delete req.body.created_at;
    delete req.body.updated_at;
    if (schema)
      schema.findByIdAndUpdate(req.body.id, req.body).then(function() {
        let referer = req.header('Referer');
        let refererUrl = new url.URL(referer);
        console.log(refererUrl.searchParams.get('test'));
        res.send({});
      }, function(err) {
        res.status(400);
        res.send(err);
      });
    else
      res.render('404');
  });

  router.post('/p/:table/action', authenticate, function(req, res) {
    let schema = new Model(req.params.table);
    if (schema)
      schema.remove({_id: req.body.items}).then(function() {
        res.send({});
      }, function(err) {
        res.status(400);
        res.send(err);
      });
    else
      res.status(404).render('404');
  });

  router.all('/api/*', authenticate, function(req, res) {
    let restApiModel = new Model('p_rest_api');
    restApiModel.findOne({url: req.url}).then(function(restApiRecord) {
      if(restApiRecord){
        let ctx = vm.createContext({req, res});
        vm.runInContext(restApiRecord.script, ctx);
      } else
        res.status(404).render('404');
    });
  });

  return router;

};
