const {assert} = require('chai');
const fs = require('fs');
const dsUtils = require('../../../src/utils/ds-utils.js');

describe('ds-utils', function() {

  it('#flatToHierarchy()', function() {
    let flat = [{id:1}, {id:2, parent: 1}];
    let output = dsUtils.flatToHierarchy(flat);
    assert.equal(output[0].id, 1);
    assert.equal(output[0].children[0].id, 2);
  });

});
