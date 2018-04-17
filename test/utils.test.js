const mocha = require('mocha');
const chai = require('chai');
const utils = require('../utils');
let describe = mocha.describe;
let it = mocha.it;
let assert = chai.assert;

describe('Utils', function() {
  it('validPassword to compare password with hashed password', function() {
    assert.isTrue(utils.validPassword('admin',
        '$2a$08$tr.RqALF3sNUNkkINTmm2uTFxu/lnyDKXiEP4Ld2n1wdKiPe03gue'),
        'Password hashing failed');
  });
});