const fs = require('fs');
const jsonfile = require('jsonfile');

exports.readJsonFileSync = function(file, options) {
  return jsonfile.readFileSync(file, options);
};

exports.writeJsonFileSync = function(file, obj) {
  return jsonfile.writeFileSync(file, obj, {spaces: 2});
};

exports.writeFileSync = function(file, str) {
  return fs.writeFileSync(file, str);
};
