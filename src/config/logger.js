const winston = require('winston');
const config = require('./config');
const _ = require('lodash');

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
        })
        //new (winston.transports.File)({ filename: 'logs/log.log', level: level })
    ],
    colors: colors
};

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            level: level
        })
        //new (winston.transports.File)({ filename: 'logs/log.log', level: level })
    ],
    colors: colors
});

logger.options = options;

let size = 50;

function logBox(str) {
    if (str)
        console.log('* ' + _.padEnd(str, size, ' ') + ' *');
    else
        console.log(_.padStart('', size + 4, '*'));
}

logger.logBox = logBox;

module.exports = logger;