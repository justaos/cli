const Model = require('anysols-model').Model;
const DatabaseConnector = require('anysols-model').DatabaseConnector;

class ModelSessionFactory {

    static createModelWithSession(sessionUser) {
        class ModelSession extends Model {
            constructor(collectionName) {
                let model = DatabaseConnector.getInstance().getConnection().model(collectionName);
                super(model);
            }
        }

        return ModelSession;
    }
}

module.exports = ModelSessionFactory;