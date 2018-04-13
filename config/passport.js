const passport = require('passport');
const myUtils = require('../utils');

const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;

module.exports = function(app, userModel) {
  passport.use(new LocalStrategy(
      function(username, password, done) {

        //Assume there is a DB module pproviding a global UserModel
        userModel.findOne({where: {username: username}}).then(function(user) {
          if (!user)
            return done(null, false, {
              found: false,
              message: 'Username does not exist'
            });

          if (!myUtils.validPassword(password, user.password))
            return done(null, false,
                {found: true, message: 'Incorrect password.'});

          return done(null, user.get(), {message: 'Logged In Successfully'});

        }).catch(function(err) {
          console.log('Error:', err);
          return done(null, false, {});
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
        return userModel.findById(jwtPayload.id).then(user => {
          return cb(null, user);
        }).catch(err => {
          return cb(err);
        });
      }
  ));

};