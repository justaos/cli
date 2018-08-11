const {ModelBuilder, ModelInterceptorProvider} = require('anysols-model');
const UserInterceptor = require('./interceptors/user.interceptor');
const ServiceScriptInterceptor = require('./interceptors/server-script.interceptor');
const JobInterceptor = require('./interceptors/job.interceptor');
const js2xmlparser = require('js2xmlparser');

class AnysolsSession {
    constructor(user) {
        let builder = new ModelBuilder();
        let interceptorProvider = new ModelInterceptorProvider();
        interceptorProvider.register('UserInterceptor', new UserInterceptor(user));
        interceptorProvider.register('ServiceScriptInterceptor', new ServiceScriptInterceptor(user, this));
        interceptorProvider.register('JobInterceptor', new JobInterceptor(user, this));
        this.model = builder.setInterceptProvider(interceptorProvider).build();
    }

    log(str) {
        console.log(str);
    }
}

module.exports = AnysolsSession;
