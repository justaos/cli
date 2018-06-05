const express = require('express');
const router = express.Router();
const config = require('./src/config/config');
const logger = require('./src/config/logger');
const passportConfig = require('./config/passport');

const app = express();

require('./config/express')(app, router);

const database = require('./config/database')();
database.connect();
const platform = require('./platform/platform')(database, router);

database.validateConnection().then(startUp, function() {
  platform.boot().then(function() {
    startUp();
  });
});

function startUp() {
  platform.startUp().then(function() {
    passportConfig(app, database.getModel('p_user'));
    router.use('/auth', require('./routes/auth'));
    platform.appStarting = false;
  });
}

router.get('/editor', (req, res, next) => {
  res.render('editor');
});

//start app on mentioned port
app.listen(config.app.port);

logger.info('listening on port ' + config.app.port);