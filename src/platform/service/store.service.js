const Q = require('q');
const logger = require('../../config/logger');

const BaseService = require('./base-service');
const modelUtils = require('../../model/model-utils');
const fileUtils = require('../../utils/file-utils');
const {path} = require('../platform-constants');


class StoreService extends BaseService {

    constructor(user) {
        super(user);
    }

    getApplications(cb) {
        let applicationModel = this.getModel('p_application');
        applicationModel.find({}, null, {sort: {order: 1}}).exec(function (err, applications) {
            if (err)
                logger.error(err);
            else cb(applications);
        });
    }

    getApplicationById(id, cb) {
        let applicationModel = this.getModel('p_application');
        applicationModel.findById(id).exec(function (err, application) {
            if (err)
                logger.error(err);
            else cb(application);
        });
    }

    installApplication(appId, loadSampleData, platform) {
        let that = this;
        let dfd = Q.defer();
        logger.info('STARTED INSTALLING');

        let applicationModel = this.getModel('p_application');
        applicationModel.findById(appId).exec((err, application) => {
            let modelDef = StoreService.readModelsForPackage(application.package);
            modelUtils.loadSchemasIntoStore(modelDef);
            StoreService.loadDataForPackage(application.package);
            if (loadSampleData)
                StoreService.loadSampleDataForPackage(application.package);
            let promises = [];
            modelDef.forEach((model) => {
                promises.push(platform.populateSysData(model));
            });
            application.installed_version = application.version;
            promises.push(application.save());
            Q.all(promises).then(dfd.resolve);
            platform.serveStaticFiles(application.package);
        });
        return dfd.promise;
    }

    /** helper functions **/
    static readModelsForPackage(pkg) {
        let modelDefinitions = fileUtils.readJsonFilesFromPathSync(path.APPS + '/' + pkg + '/models/**.json');
        let defaultFields = fileUtils.readJsonFileSync(path.DEFAULT_FIELDS);
        modelDefinitions.forEach(function (modelDef) {
            modelDef.fields = modelDef.fields.concat(defaultFields);
        });
        return modelDefinitions;
    }

    static loadDataForPackage(pkg) {
        return modelUtils.loadDataFromPath(path.APPS + '/' + pkg + '/updates/**.json');
    }

    static loadSampleDataForPackage(pkg) {
        return modelUtils.loadDataFromPath(path.APPS + '/' + pkg + '/samples/**.json');
    }
}

module.exports = StoreService;