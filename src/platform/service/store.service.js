const Q = require('q');
const logger = require('../../config/logger');

const BaseService = require('./base.service');
const modelUtils = require('../model-utils');
const fileUtils = require('../../utils/file-utils');
const constants = require('../platform-constants');
const ViewService = require('./view.service');


class StoreService extends BaseService {

    constructor(user) {
        super(user);
    }

    /** helper functions **/
    static readModelsForPackage(pkg) {
        let modelDefinitions = fileUtils.readJsonFilesFromPathSync(constants.path.APPS + '/' + pkg + '/models/**.json');
        let defaultFields = fileUtils.readJsonFileSync(constants.path.DEFAULT_FIELDS);
        modelDefinitions.forEach(function (modelDef) {
            modelDef.fields = modelDef.fields.concat(defaultFields);
        });
        return modelDefinitions;
    }

    static loadDataForPackage(pkg) {
        return modelUtils.loadDataFromPath(constants.path.APPS + '/' + pkg + '/updates/**/*.json');
    }

    static loadSampleDataForPackage(pkg) {
        return modelUtils.loadDataFromPath(constants.path.APPS + '/' + pkg + '/samples/**/*.json');
    }

    getApplications(cb) {
        let Application = this._as.model('p_application');
        Application.find({}, null, {sort: {order: 1}}).exec().then(function (applications) {
            cb(applications);
        });
    }

    getApplicationById(id, cb) {
        let Application = this._as.model('p_application');
        Application.findById(id).exec().then(function (application) {
            cb(application);
        });
    }

    installApplication(appId, loadSampleData, platform) {
        logger.info('STARTED INSTALLING');
        let that = this;
        let dfd = Q.defer();
        let Application = this._as.model('p_application');
        Application.findById(appId).exec().then((application) => {
            let pkg = application.get('package');
            let schemaDefinitions = StoreService.readModelsForPackage(pkg);
            modelUtils.loadSchemasIntoStore(schemaDefinitions);

            let promises = [];
            promises.push(StoreService.loadDataForPackage(pkg));

            if (loadSampleData)
                StoreService.loadSampleDataForPackage(pkg);

            schemaDefinitions.forEach((def) => {
                promises.push(platform.populateSysData(def));
            });

            application.set('installed_version', application.get('version'));
            promises.push(application.save());

            Q.all(promises).then(() => {
                schemaDefinitions.forEach((def) => {
                    new ViewService(that.sessionUser, def.name).createDefaultView();
                });
                dfd.resolve();
            });
            platform.serveStaticFiles(pkg);
        });
        return dfd.promise;
    }
}

module.exports = StoreService;
