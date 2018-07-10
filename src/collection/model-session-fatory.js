const Model = require('./model');

class ModelSessionFactory {

  static createModelWithSession(sessionUser) {
    class ModelSession extends Model {
      constructor(modelName){
        super(modelName);
      }
      getSessionUser() {
        return sessionUser;
      }
    }

    return ModelSession;
  }
}

module.exports = ModelSessionFactory;