const {assert} = require('chai');
const fs = require('fs');
const fileUtils = require('../../../src/utils/file-utils.js');

describe('File Utility Unit Tests', function() {

  it('#readJsonFileSync()', function() {
    let obj = fileUtils.readJsonFileSync('test/resources/sample.json');
    assert.equal(obj.title, 'Hello');
  });

  it('#writeJsonFileSync()', function() {
    fileUtils.writeJsonFileSync('test/resources/write.json', {title: 'Write'});
    let obj = fileUtils.readJsonFileSync('test/resources/write.json');
    assert.equal(obj.title, 'Write');
  });

  it('#writeFileSync()', function() {
    fileUtils.writeFileSync('test/resources/write.txt', 'Write');
    let str = fs.readFileSync('test/resources/write.txt');
    assert.equal(str, 'Write');
  });

  after(function() {
    fs.unlinkSync('test/resources/write.json');
    fs.unlinkSync('test/resources/write.txt');
  });

});