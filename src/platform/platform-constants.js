const config = require('../config/config');

const constants = {};

/**
 * Platform model names
 */
constants.model = {};
constants.model.ACL = 'p_acl';
constants.model.APPLICATION = 'p_application';
constants.model.COLLECTION = 'p_collection';
constants.model.FIELD = 'p_field';
constants.model.OPTION = 'p_option';


constants.path = {};
constants.path.APPS = config.cwd + '/resources/apps';

constants.path.PATFORM_RESOUCES = config.root + '/resources/platform';
constants.path.DEFAULT_FIELDS = constants.path.PATFORM_RESOUCES + '/default-fields.json';
constants.path.PATFORM_MODELS = constants.path.PATFORM_RESOUCES + '/models';

constants.path.P_COLLECTION_MODEL = constants.path.PATFORM_MODELS + '/' + constants.model.COLLECTION + '.json';
constants.path.P_FIELD_MODEL = constants.path.PATFORM_MODELS + '/' + constants.model.FIELD + '.json';
constants.path.P_OPTION_MODEL = constants.path.PATFORM_MODELS + '/' + constants.model.OPTION + '.json';

module.exports = constants;
