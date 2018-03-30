const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');


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
            res.cookie('x-auth-token', token, {maxAge: 900000, httpOnly: true});

            return res.json({user, token});
        });
    })
    (req, res);

});

router.get('/login', (req, res, next) => {
    res.render('signin');
});

router.get('/logout', (req, res, next) => {
    res.clearCookie('x-auth-token');
    res.redirect('./login');
});

module.exports = router;