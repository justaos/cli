const fs = require('fs');
const glob = require('glob');
const jsonfile = require('jsonfile');

let fileUtils = {};

fileUtils.readJsonFileSync = function(file, options) {
  return jsonfile.readFileSync(file, options);
};

fileUtils.readJsonFilesFromPathSync = function(path, options) {
  let result = [];
  glob.sync(path).forEach(function(file) {
    let data = fileUtils.readJsonFileSync(file);
    result.push(data);
  });
  return result;
};

fileUtils.writeJsonFileSync = function(file, obj) {
  return jsonfile.writeFileSync(file, obj, {spaces: 2});
};

fileUtils.writeFileSync = function(file, str) {
  return fs.writeFileSync(file, str);
};

module.exports = fileUtils;
