const chai = require('chai');
const utils = require('../utils');
var assert = chai.assert;

describe('Array', function() {
  it('should start empty', function() {

    assert.notEqual(utils.generateHash(), 0);
  });
});