let Model = require('./src/model/');
let DatabaseConnection = require('./src/config/database-connector');
let fileUtils = require('./src/utils/file-utils');
const path = require('path');
const rootPath = path.normalize(__dirname);
const mongoose = require('mongoose');
extend = require('mongoose-schema-extend');



const PLATFORM_MODELS_PATH = rootPath + '/resources/platform/models/**.json';
let db = new DatabaseConnection();
db.connect().then(function() {
  let conn = db.getConnection();
  let platformSchemaDefinitions = fileUtils.readJsonFilesFromPathSync(
      PLATFORM_MODELS_PATH);

  Model.setDatabase(db);
  Model.loadSchemasIntoStore(platformSchemaDefinitions);

  let model = conn.model('sys_collection');

  //let a = new model({name: 'shivaji', age: 'sss'});
  //a.save().then(function(){
  model.find({}, null, {lean: true}).then(function(res) {
    console.log(res);
  });

  //});

}, function onError(err) {
  process.exit(0);
});

process.on('unhandledRejection', function onError(err) {
  console.error(err);
  //process.exit(0);
});
