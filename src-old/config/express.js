const express = require('express');
const engine = require('express-ejs-layouts');
const expressWinston = require('express-winston');
const logger = require('../config/logger');
const config = require('../config/config');

module.exports = function (app, router) {

    // don't use logger for test env
    if (config.env !== 'test') {
        //app.use(expressWinston.logger(logger.options));
    }

    //app.use(express.favicon());
    app.use(express.static(config.root + '/public'));
    app.set('layout', 'layouts/blank');


};
