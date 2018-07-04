'use strict';
const getModel = require('../../model');

function buildConditions(query) {
  let conditions = {};
  if (query.conditions) {
      conditions = JSON.parse(query.conditions);
  }
  return conditions;
}

function buildOptions(query){
  let options;
  if (req.query.sort) {
      options = {};
      options.sort = JSON.parse(req.query.sort);
  }
  return options;
}

module.exports = function(req, res) {
    let Model = getModel(req.user);
    new Model('p_collection').findOne({
        name: req.params.collection
    }).
    then(function(collection) {
        let collectionModel = new Model(req.params.collection);
        if (collectionModel)
            new Model('p_field').find({
                ref_collection: collection.id
            }).
        then(function(cols) {
            let conditions = buildConditions(req.query),
                options = buildOptions(req.query);
            collectionModel.find(conditions, null, options).then(function(data) {
                res.render('pages/list', {
                    collection: {
                        label: collection.label,
                        name: collection.name
                    },
                    data: data,
                    cols: cols,
                    layout: 'layouts/no-header-layout'
                });
            });
        });
        else
            res.render('404');
    });
};
