const bcrypt = require('bcrypt-nodejs');

module.exports = {
    // generating a hash
    generateHash: function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },

    // checking if password is valid
    validPassword: function (password, hashedPwd) {
        return bcrypt.compareSync(password, hashedPwd);
    },

    flatToHierarchy: function (flat) {

        let roots = [];// things without parent

        let all = {};

        flat.forEach(function (item) {
            all[item.id] = item
        });

        // connect children to its parent, and split roots apart
        Object.keys(all).forEach(function (id) {
            let item = all[id];
            if (item.parent === null) {
                roots.push(item)
            } else if (item.parent in all) {
                let p = all[item.parent];
                if (!('children' in p)) {
                    p.children = []
                }
                p.children.push(item)
            }
        });

        // done!
        return roots
    }
};