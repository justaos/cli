const dataTypes = require('./data-types');
const mongoose = require('mongoose');

function converter(collectionDef) {
    let schema = {};
    if (collectionDef.fields) {
        collectionDef.fields.forEach(function (fieldDef) {
            let property = {};
            if (fieldDef.name === 'created_at' || fieldDef.name === 'updated_at') {
                return;
            }
            switch (fieldDef.type) {
                case dataTypes.STRING :
                    property.type = dataTypes.STRING.getType();
                    break;
                case 'integer' :
                    property.type = dataTypes.INTEGER.getType();
                    break;
                case 'boolean' :
                    property.type = Boolean;
                    break;
                case 'reference' :
                    if(fieldDef.ref) {
                        property.type = mongoose.Schema.Types.ObjectId;
                        property.ref = fieldDef.ref;
                    } else
                        property.type = dataTypes.STRING.getType();
                    break;
                default:
                    property.type = dataTypes.STRING.getType();
            }
            schema[fieldDef.name] = property;
        });
    }
    let mongooseSchema = new mongoose.Schema(schema, {
        toObject: {virtuals: true},
        timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
    });
    mongooseSchema.virtual('id').set(id => {
        this._id = new ObjectId(id);
    });
    return mongooseSchema;
}

module.exports = converter;
