const bcrypt = require('bcrypt-nodejs');
const fs = require('fs');

module.exports = {

  flatToHierarchy: function(flat) {

    let roots = [];// things without parent
    let all = {};
    flat.forEach(function(item) {
      all[item.id] = item;
    });

    // connect children to its parent, and split roots apart
    Object.keys(all).forEach(function(id) {
      let item = all[id];
      if (item.parent === null) {
        roots.push(item);
      } else if (item.parent in all) {
        let p = all[item.parent];
        if (!('children' in p)) {
          p.children = [];
        }
        p.children.push(item);
      }
    });

    // done!
    return roots;
  },

  underscoreToCamelCase: function(input) {
    input = input.charAt(0).toUpperCase() + input.substr(1);
    return input.replace(/_(.)/g, function(match, letter) {
      return ' ' + letter.toUpperCase();
    });
  }
};