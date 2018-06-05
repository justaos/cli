const logger = require('../config/logger');
const fileUtils = require('../utils/file-utils');
const Model = require('../model');
const Q = require('q');

function cleanInstall(platform, PLATFORM_MODELS_PATH) {
  let db = Model.getDatabase();
  let dfd = Q.defer();
  logger.info('platform', 'clean installing...');
  db.dropDatabase().then(function() {
    let platformSchemaDefinitions = fileUtils.readJsonFilesFromPathSync(PLATFORM_MODELS_PATH);
    Model.loadSchemasIntoStore(platformSchemaDefinitions);

    let promises = [];

    platformSchemaDefinitions.forEach(function(def){
      promises.push(platform.populateSysData(def));
    });

    Q.all(promises).then(function(){
      logger.info('platform','clean installation complete');
      dfd.resolve();
    })

  });
  return dfd.promise;
}

module.exports = cleanInstall;