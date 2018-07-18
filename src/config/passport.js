const passport = require('passport');
const cache = require('memory-cache');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const Q = require('q');

const hashUtils = require('../utils/hash-utils');
const Model = require('../model/index');

const JWTStrategy = passportJWT.Strategy;

module.exports = function () {
    passport.use(new LocalStrategy(
        function (username, password, done) {

            //Assume there is a DB module providing a global UserModel
            new Model('p_user').findOne({username: username}).exec(function (err, user) {
                if (err)
                    return done(null, false, {
                        found: false,
                        message: 'Username does not exist'
                    });

                if (!hashUtils.validateHash(password, user.password))
                    return done(null, false,
                        {found: true, message: 'Incorrect password.'});

                return done(null, user.toObject(), {message: 'Logged In Successfully'});

            });
        }));

    passport.use(new JWTStrategy({
            jwtFromRequest: function (req) {
                let token = null;
                if (req && req.cookies)
                    token = req.cookies['x-auth-token'];
                return token;
            },
            secretOrKey: process.env.JWT_SECRET || 'secret'
        },
        function (jwtPayload, cb) {

            //find the user in db if needed
            return new Model('p_user').findById(jwtPayload.id).exec((err, user) => {
                delete user.password;
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
        new Model('p_user_role').find({user: userId}).exec(function (err, userRoles) {
            cache.put(userId, userRoles, 24 * 60 * 60 * 1000);
            dfd.resolve(userRoles);
        })
    }
    return dfd.promise;
}