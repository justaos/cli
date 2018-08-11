const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('../config/config');
const cache = require('memory-cache');

/* POST login. */
router.post('/login', function (req, res, next) {

    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err || !user)
            return res.status(400).json({
                message: info ? info.message : 'Login failed',
                user: info.found
            });

        cache.del(user.id);
        req.login(user, {session: false}, (err) => {
            if (err)
                res.send(err);

            const token = jwt.sign(user, config.app.cookieSecret || 'secret');
            res.cookie(config.app.cookieName, token,
                {maxAge: config.app.tokenExpiration, httpOnly: true});
            return res.json({token});
        });
    })
    (req, res);

});

router.get('/login', (req, res, next) => {
    res.render('signin');
});

router.get('/logout', (req, res, next) => {
    res.clearCookie(config.app.cookieName);
    res.redirect('./login');
});

module.exports = router;