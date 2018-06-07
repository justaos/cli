const {assert} = require('chai');
const stringUtils = require('../../../src/utils/string-utils');

describe('string-utils', function() {

  it('#underscoreToCamelCase()', function() {
    assert.equal(stringUtils.underscoreToCamelCase('hello_world'), 'Hello World');
    assert.equal(stringUtils.underscoreToCamelCase('_hello_world_'), ' Hello World ');
  });

});