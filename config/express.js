const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const engine = require('ejs-locals');
const compression = require('compression');
const expressWinston = require('express-winston');
const logger = require('./logger');
const config = require('./config');

module.exports = function (app, router) {

    // don't use logger for test env
    if (config.env !== 'test') {
        app.use(expressWinston.logger(logger.options))
    }

    // should be placed before express.static
    app.use(compression({
        filter: function (req, res) {
            return /json|text|javascript|css/.test(res.getHeader('Content-Type'))
        },
        level: 9
    }));

    //app.use(express.favicon());
    app.use(express.static(config.root + '/public'));

    app.use('/assets', express.static(config.root + '/assets'));
    app.use('/views/styles/', express.static(config.root + '/views/styles'));

    // set views path, template engine and default layout
    app.engine('ejs', engine);
    app.set('views', config.root + '/views');
    app.set('view engine', 'ejs');


    // cookieParser should be above session
    app.use(cookieParser());// For Passport
    //app.use(session({secret: 'keyboard cat', resave: true, saveUninitialized: true})); // session secret

    //bodyParser
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

    // use passport session
    // app.use(passport.initialize());
    // app.use(passport.session()); // persistent login sessions

    // routes should be at the last
    app.use(router);

    // assume "not found" in the error msgs
    // is a 404. this is somewhat silly, but
    // valid, you can do whatever you like, set
    // properties, use instanceof etc.
    app.use(function (err, req, res, next) {
        // treat as 404
        if (err.message
            && (~err.message.indexOf('not found')
                || (~err.message.indexOf('Cast to ObjectId failed')))) {
            return next()
        }

        // log it
        // send emails if you want
        logger.error(err.stack);

        // error page
        res.status(500).render('500', {error: err.stack});
    });

    // assume 404 since no middleware responded
    app.use(function (req, res, next) {
        res.status(404).render('404', {
            url: req.originalUrl,
            error: 'Not found'
        })
    });

};