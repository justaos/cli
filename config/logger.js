const winston = require('winston');
const config = require('./config');

//
// Logging levels
//
const colors = {
    info: 'green',
    debug: 'blue',
    error: 'red'
};

const level = config.loggerLevel;

const options = {
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            level: level
        }),
        //new (winston.transports.File)({ filename: 'logs/log.log', level: level })
    ],
    colors: colors,
};

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            level: level
        }),
        //new (winston.transports.File)({ filename: 'logs/log.log', level: level })
    ],
    colors: colors,
});

logger.options = options;

module.exports = logger;