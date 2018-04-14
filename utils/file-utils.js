const jsonfile = require('jsonfile');

exports.readJsonFileSync = function(file, options) {
  return jsonfile.readFileSync(file, options);
};