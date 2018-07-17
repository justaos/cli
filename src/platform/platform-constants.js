const config = require('../config/config');

let constants = {};

constants.DEFAULT_FIELDS_PATH = config.root + '/resources/platform/default-fields.json';
if (config.mode === 'internal')
    constants.PROD_PATH = config.cwd + '/resources/apps/';
else
    constants.PROD_PATH = config.cwd + '/apps/';


module.exports = constants;