const passport = require('passport');
const cache = require('memory-cache');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const Q = require('q');
const hashUtils = require('../utils/hash-utils');
const config = require('../config/config');
const JWTStrategy = passportJWT.Strategy;
const modelUtils = require('../platform/model-utils');

module.exports = function () {

    passport.use(new JWTStrategy({
            jwtFromRequest: function (req) {
                let token = null;
                if (req && req.cookies)
                    token = req.cookies[config.app.cookieName];
                return token;
            },
            secretOrKey: config.app.cookieSecret || 'secret'
        },
        function (jwtPayload, cb) {
            const anysolsModel = modelUtils.getAnysolsModel();
            //find the user in db if needed
            return anysolsModel.model('p_user').findById(jwtPayload.id).exec().then((user) => {
                if (user) {
                    user = user.toObject();
                    getUserRoles(user.id).then(function (userRoles) {
                        user.hasRole = function (roleName) {
                            let i;
                            for (i = 0; i < userRoles.length; i++) {
                                if (userRoles[i].role.name === roleName) {
                                    return true;
                                }
                            }
                            return false;
                        };
                        user.hasRoleId = function (roleId) {
                            let i;
                            for (i = 0; i < userRoles.length; i++) {
                                if (userRoles[i].role.id === roleId) {
                                    return true;
                                }
                            }
                            return false;
                        };
                        cb(null, user);

                    });
                } else
                    throw Error('no such user')
            });
        }
    ));

};

function getUserRoles(userId) {
    let dfd = Q.defer();
    let userRoles = cache.get(userId);
    if (userRoles) {
        dfd.resolve(userRoles);
    } else {
        const anysolsModel = modelUtils.getAnysolsModel();
        anysolsModel.model('p_user_role').find({user: userId}).populateRefs().exec().then(function (userRoles) {
            userRoles = userRoles.map(userRole => userRole.toObject());
            cache.put(userId, userRoles, 24 * 60 * 60 * 1000);
            dfd.resolve(userRoles);
        })
    }
    return dfd.promise;
}
