const bcrypt = require('bcrypt-nodejs');
const fs = require('fs');

module.exports = {
  // generating a hash
  generateHash: /* istanbul ignore next */ function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  },

  // checking if hash is valid
  validateHash: function(data, encrypted) {
    return bcrypt.compareSync(data, encrypted);
  }

};