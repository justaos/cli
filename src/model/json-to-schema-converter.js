const dataTypes = require('./data-types');
const mongoose = require('mongoose');

function converter(collectionDef) {
  let schema = {};
  collectionDef.fields.forEach(function(fieldDef) {
    let property;
    switch (fieldDef.type) {
      case 'string' :
        property = stringConverter(fieldDef);
        break;
      case 'number' :
        property = stringConverter(fieldDef);
        break;
      default:
        property = {};
        property.type = String;
    }
    schema[fieldDef.name] = property;
  });
  let mongooseSchema = new mongoose.Schema(schema, { toObject: { virtuals: true }});
  mongooseSchema.virtual('id').set(id => {
   this._id = new ObjectId(id);
  });
  return mongooseSchema;
}

function stringConverter(propertyDef) {
  let property = {};
  property.type = String;
  return property;
}

module.exports = converter;