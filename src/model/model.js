const mongoose = require('mongoose');

const DatabaseConnector = require('../config/database-connector');

module.exports = function (loggedInUser) {

    let privateData = new WeakMap();

    class Model {

        constructor(modelName) {
            privateData.set(this, {});
            privateData.get(this).modelName = modelName;
            let conn = DatabaseConnector.getInstance().getConnection();
            privateData.get(this).model = conn.model(modelName);
        }

        getSchemaDef() {
            return privateData.get(this).model.def;
        }

        /**
         * START - mongoose methods wrapping
         */

        create(docs) {
            if (loggedInUser) {
                if (docs instanceof Array)
                    docs.forEach(function (doc) {
                        doc.created_by = loggedInUser.id;
                    });
                else
                    docs.created_by = loggedInUser.id;
            }
            return privateData.get(this).model.create(docs);
        }

        find(conditions, projection, options) {
            return privateData.get(this).model.find(conditions, projection, options);
        }

        findById(id) {
            return privateData.get(this).model.findById(id);
        }

        findByIdAndUpdate(id, obj) {
            let condition = {_id: mongoose.Types.ObjectId(id)};
            return this.findOneAndUpdate(condition, obj, !id);
        }

        findOneAndUpdate(condition, obj, create) {
            if (loggedInUser) {
                obj.updated_by = loggedInUser.id;
                if (create) {
                    obj.created_by = loggedInUser.id;
                }
            }
            return privateData.get(this).model.findOneAndUpdate(condition, obj, {upsert: true}).exec();
        }

        update(condition, obj) {
            return privateData.get(this).model.update(condition, obj).exec();
        }

        where(obj) {
            return privateData.get(this).model.where(obj);
        }

        /**
         * END - mongoose methods wrapping
         */

    }

    return Model;
};

