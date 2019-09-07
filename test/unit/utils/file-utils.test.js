const {assert} = require('chai');
const fs = require('fs');
const fileUtils = require('../../../src-js/utils/file-utils.js');

describe('file-utils', function() {

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

  it('#readJsonFilesFromPathSync()', function() {
    let objs = fileUtils.readJsonFilesFromPathSync('test/resources/path/**.json');
    assert.equal(objs[0].title, 'a');
    assert.equal(objs[1].title, 'b');
  });

  after(function() {
    fs.unlinkSync('test/resources/write.json');
    fs.unlinkSync('test/resources/write.txt');
  });

});
