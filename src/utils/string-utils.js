
module.exports = {
  // generating a hash
  underscoreToCamelCase: function(input) {
    input = input.charAt(0).toUpperCase() + input.substr(1);
    return input.replace(/_(.)/g, function(match, letter) {
      return ' ' + letter.toUpperCase();
    });
  }

};