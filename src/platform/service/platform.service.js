const Q = require('q');
const vm = require('vm');

const logger = require('../../config/logger');
const modelUtils = require('../../model/model-utils');
const BaseService = require('./base.service');
const constants = require('../platform-constants');


class PlatformService extends BaseService {

    constructor(user) {
        super(user);
    }

    static loadPlatformUpdates() {
        return PlatformService.loadUpdates(constants.path.PATFORM_RESOUCES);
    }

    static loadUpdates(path) {
        return modelUtils.loadDataFromPath(path + '/updates/**/*.json');
    }

    async executeRestApi(req, res, next) {
        let that = this;
        let RestApi = this._as.model('p_rest_api');
        let restApiRecord = await RestApi.findOne({url: req.url, method: req.method}).exec();
        if (restApiRecord) {
            let ctx = vm.createContext({req, res, next, as: that._as, JSON});
            vm.runInContext(restApiRecord.get('script'), ctx);
        } else
            throw new Error('Rest api not found');
    }

    async executeAction(collectionName, recordIds) {
        let Model = this._as.model(collectionName);
        let records = await Model.find({_id: recordIds}).exec();
        records.forEach(async function (record) {
            await record.remove();
        });
    }

}

module.exports = PlatformService;
