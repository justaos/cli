const {assert} = require('chai');
const fs = require('fs');
const mongoose = require('mongoose');
const jsonToSchemaConverter = require('../../../src/model/json-to-schema-converter.js');

describe('data-types', function() {

  it('#instanceof check', function() {
    let schema = jsonToSchemaConverter({});
    assert.isTrue(schema instanceof mongoose.Schema);
  });

});
