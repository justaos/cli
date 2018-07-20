const config = require('../config/config');

const constants = {};

constants.path = {};
constants.path.APPS = config.cwd + '/resources/apps';

constants.path.PATFORM_RESOUCES = config.root + '/resources/platform';
constants.path.DEFAULT_FIELDS = constants.path.PATFORM_RESOUCES + '/default-fields.json';
constants.path.PATFORM_MODELS = constants.path.PATFORM_RESOUCES + '/models';

constants.path.P_COLLECTION_MODEL = constants.path.PATFORM_MODELS + '/p_collection.json';
constants.path.P_FIELD_MODEL = constants.path.PATFORM_MODELS + '/p_field.json';
constants.path.P_OPTION_MODEL = constants.path.PATFORM_MODELS + '/p_option.json';

module.exports = constants;
