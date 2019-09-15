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

    app.use('/assets', express.static(config.root + '/assets'));
    app.use('/ui/styles/', express.static(config.root + '/resources/platform/ui/styles'));
    app.use('/ui/scripts/', express.static(config.root + '/resources/platform/ui/scripts'));

    // set ui path, template engine and default layout
    app.use(engine);
    app.set('views', config.root + '/resources/platform/ui');
    app.set('view engine', 'ejs');

};
