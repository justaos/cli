const logger = require('../config/logger');
const fileUtils = require('../utils/file-utils');
const Model = require('../model');

const modelUtils = require('../model/model-utils');
const Q = require('q');

let cleanInstall = (platform, PLATFORM_MODELS_PATH) => {
  let db = Model.getDatabase();
  let dfd = Q.defer();
  logger.info('platform', 'clean installing...');
  db.dropDatabase().then(function() {
    let platformSchemaDefinitions = fileUtils.readJsonFilesFromPathSync(
        PLATFORM_MODELS_PATH);
    modelUtils.loadSchemasIntoStore(platformSchemaDefinitions);

    let promises = [];

    platformSchemaDefinitions.forEach(def => {
      promises.push(platform.populateSysData(def));
    });

    Q.all(promises).then(() => {
      logger.info('platform', 'clean installation complete');
      dfd.resolve();
    });

  });
  return dfd.promise;
}

module.exports = cleanInstall;
