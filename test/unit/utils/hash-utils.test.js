const {assert} = require('chai');
const hashUtils = require('../../../src/utils/hash-utils');

describe('Hash Utility Unit Tests', function() {

  it('#validateHash()', function() {
    assert.isTrue(hashUtils.validateHash('admin',
        '$2a$08$tr.RqALF3sNUNkkINTmm2uTFxu/lnyDKXiEP4Ld2n1wdKiPe03gue'),
        'hashing comparision failed');
  });

  it('#generateHash()', function() {
    let hash = hashUtils.generateHash('admin');
    assert.isTrue(hashUtils.validateHash('admin', hash),
        'invalid hash generated'
    );
  });

});