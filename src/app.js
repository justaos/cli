'use strict';
const Platform = require('./platform');
const express = require('express');
const router = express.Router();
const logger = require('./config/logger');
const config = require('./config/config');
const passportConfig = require('./config/passport');

let clean = false;
const app = express();
require('./config/express')(app, router);

let platform = new Platform(router);

platform.initialize().then(function(db) {
  if (clean) {
    platform.cleanInstall().then(function() {
      platform.boot();
    });
  } else {
    db.checkDatabase().then(function(){
      platform.boot();
    }, function(){
      platform.cleanInstall().then(function() {
        platform.boot();
        logger.info('Scanning for apps');
      });
    });
  }
}, function() {
  process.exit(0);
});

passportConfig();
router.use('/auth', require('./routes/auth'));
platform.appStarting = false;

router.get('/editor', (req, res, next) => {
  res.render('editor');
});

//start app on mentioned port
app.listen(config.app.port);

logger.info('listening on port ' + config.app.port);

process.on('unhandledRejection', function onError(err) {
  console.error(err);
});