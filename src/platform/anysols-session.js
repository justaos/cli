const modelUtils = require('./model-utils');
const UserInterceptor = require('./interceptors/user.interceptor');
const ServiceScriptInterceptor = require('./interceptors/server-script.interceptor');
const JobInterceptor = require('./interceptors/job.interceptor');
const js2xmlparser = require('js2xmlparser');

class AnysolsSession {
    constructor(user) {
        let anysolsModel = modelUtils.getAnysolsModel();
        anysolsModel.addInterceptor('UserInterceptor', new UserInterceptor(user));
        anysolsModel.addInterceptor('ServiceScriptInterceptor', new ServiceScriptInterceptor(user, this));
        anysolsModel.addInterceptor('JobInterceptor', new JobInterceptor(user, this));
        this.model = function(modelName) {
            return anysolsModel.model(modelName);
        };
    }

    log(str) {
        console.log(str);
    }
}

module.exports = AnysolsSession;
