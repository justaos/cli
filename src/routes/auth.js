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

        req.login(user, {session: false}, (err) => {
            if (err)
                res.send(err);

            const token = jwt.sign(user, process.env.JWT_SECRET || 'secret');
            res.cookie('x-auth-token', token,
                {maxAge: config.app.tokenExpiration, httpOnly: true});
            res.cookie('x-authenticated', true, {maxAge: config.app.tokenExpiration});
            return res.json({token});
        });
    })
    (req, res);

});

router.get('/login', (req, res, next) => {
    res.render('signin');
});

router.get('/logout', (req, res, next) => {
    if (req.user)
        cache.del(req.user.id);
    res.clearCookie('x-auth-token');
    res.clearCookie('x-authenticated');
    res.redirect('./login');
});

module.exports = router;