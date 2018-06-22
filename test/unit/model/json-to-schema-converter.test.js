const {assert} = require('chai');
const fs = require('fs');
const mongoose = require('mongoose');
const jsonToSchemaConverter = require('../../../src/model/json-to-schema-converter.js');

describe('data-types', function() {

  it('#empty', function() {
    let schema = jsonToSchemaConverter({});
    assert.equal((typeof schema), mongoose.Schema);
  });

});
