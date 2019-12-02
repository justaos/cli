const config = require('../config/config');

/**
 * Platform model names
 */
let model = {};
model.ACL = 'p_acl';
model.APPLICATION = 'p_application';
model.COLLECTION = 'p_collection';
model.FIELD = 'p_field';
model.OPTION = 'p_option';


let path = {};
path.APPS = config.cwd + '/resources/apps';

path.PATFORM_RESOUCES = config.root + '/resources/platform';
path.DEFAULT_FIELDS = path.PATFORM_RESOUCES + '/default-fields.json';
path.PATFORM_MODELS = path.PATFORM_RESOUCES + '/models';

path.P_COLLECTION_MODEL = path.PATFORM_MODELS + '/' + model.COLLECTION + '.json';
path.P_FIELD_MODEL = path.PATFORM_MODELS + '/' + model.FIELD + '.json';
path.P_OPTION_MODEL = path.PATFORM_MODELS + '/' + model.OPTION + '.json';

module.exports = {model, path};
