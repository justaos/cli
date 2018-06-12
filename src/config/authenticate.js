const passport = require('passport');

module.exports = function(req, res, next) {
  passport.authenticate('jwt', function(err, user, info) {
    if (err)
      return next(err);
    if (!user)
      return res.redirect('/auth/login?redirect=' + req.originalUrl);
    next();
    return null;
  })(req, res, next);
};