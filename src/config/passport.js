const passport = require('passport');
const cache = require('memory-cache');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const Q = require('q');

const hashUtils = require('../utils/hash-utils');
const {ModelBuilder} = require('anysols-model');
const model = new ModelBuilder().build();

const config = require('../config/config');

const JWTStrategy = passportJWT.Strategy;

module.exports = function () {
    passport.use(new LocalStrategy(
        function (username, password, done) {

            //Assume there is a DB module providing a global UserModel
            username = username.replace('.', '[.]');
            model('p_user').findOne({username: new RegExp(`^${username}$`, 'i')}).exec().then(function (user) {
                if (!user)
                    return done(null, false, {
                        found: false,
                        message: 'Username does not exist'
                    });

                if (!hashUtils.validateHash(password, user.get('password')))
                    return done(null, false,
                        {found: true, message: 'Incorrect password.'});

                return done(null, user.toObject(), {message: 'Logged In Successfully'});

            });
        }));

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

            //find the user in db if needed
            return model('p_user').findById(jwtPayload.id).exec().then((user) => {
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
        model('p_user_role').populateReferences().find({user: userId}).exec().then(function (userRoles) {
            userRoles = userRoles.map(userRole => userRole.toObject());
            cache.put(userId, userRoles, 24 * 60 * 60 * 1000);
            dfd.resolve(userRoles);
        })
    }
    return dfd.promise;
}
