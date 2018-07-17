const ModelSessionFactory = require('../../model/model-session-fatory');

class BaseService {

    constructor(user) {
        this.sessionUser = user;
        this.Model = ModelSessionFactory.createModelWithSession(user);
    }

    getModel(modelName) {
        return new this.Model(modelName);
    }

}

module.exports = BaseService;