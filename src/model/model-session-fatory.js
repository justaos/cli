const Model = require('./model');

class ModelSessionFactory {

    static createModelWithSession(sessionUser) {
        class ModelSession extends Model {
            constructor(modelName) {
                super(modelName);
            }

            getSessionUser() {
                return sessionUser;
            }

            getInterceptor() {
                let that = this;
                /*
                 * To be over written in ModelSession class.
                 */
                return {
                    intercept: function (operation, when, docs) {
                        let dfd = Q.defer();
                        dfd.resolve(docs);
                        return dfd.promise;
                    }
                };
            }
        }

        return ModelSession;
    }
}

module.exports = ModelSessionFactory;