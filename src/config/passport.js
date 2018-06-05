const passport = require('passport');
const hashUtils = require('../utils/hash-utils');

const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const Model = require('../model');

module.exports = function(app) {
  passport.use(new LocalStrategy(
      function(username, password, done) {

        //Assume there is a DB module pproviding a global UserModel
        new Model('p_user').where({username: username}).findOne(function(err, user) {
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
        jwtFromRequest: function(req) {
          let token = null;
          if (req && req.cookies)
            token = req.cookies['x-auth-token'];
          return token;
        },
        secretOrKey: process.env.JWT_SECRET || 'secret'
      },
      function(jwtPayload, cb) {

        //find the user in db if needed
        return new Model('p_user').findById(jwtPayload.id).exec((err, user) => {
          return cb(null, user);
        });
      }
  ));

};