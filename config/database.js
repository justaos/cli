const config = require('../src/config/config');
const Q = require('q');
const logger = require('../src/config/logger');
const Sequelize = require('sequelize');

module.exports = function() {

  let connection;

  let models = {};

  return {
    setModels: function(m) {
      models = m;
    },
    getModels: function() {
      return models;
    },
    getModel: function(name) {
      return models[name];
    },
    setModel: function(name, model) {
      models[name] = model;
    },
    connect: function() {
      connection = new Sequelize(config.db.name, config.db.user,
          config.db.password, {
            host: config.db.host,
            port: config.db.port,
            dialect: config.db.dialect,
            pool: {
              max: 5,
              min: 0,
              acquire: 30000,
              idle: 10000
            },
            define: {
              //prevent sequelize from pluralizing table namesN
              freezeTableName: true,
              createdAt: 'sys_created_on',
              updatedAt: 'sys_updated_on'
            },
            logging: function(str) {
              logger.info(str);
            },
            operatorsAliases: false
          });
      return connection;
    },
    getConnection: function() {
      return connection;
    },
    connectToInstance: function() {
      return new Sequelize('', config.db.user, config.db.password, {
        host: config.db.host,
        port: config.db.port,
        dialect: config.db.dialect,
        operatorsAliases: false
      });
    },
    createDatabase: function() {
      let dfd = Q.defer();
      const sequelize = this.connectToInstance();
      sequelize.query('DROP DATABASE IF EXISTS ' + config.db.name + ';').
          then(function() {
            sequelize.query('CREATE DATABASE ' + config.db.name + ';').
                then(function() {
                  sequelize.close();
                  dfd.resolve();
                });
          });
      return dfd.promise;
    },
    deleteDatabase: function() {
      this.connectToInstance().
          query('DROP DATABASE IF EXISTS ' + config.db.name + ';');
    },
    validateConnection: function() {
      let dfd = Q.defer();
      connection.authenticate().then(() => {
        dfd.resolve();
        logger.info('Database connection has been established successfully.');
      }).catch(err => {
        if (err.original.code === 'ER_BAD_DB_ERROR') {
          dfd.reject(err);
          logger.info('Database ' + config.db.name + ' doesn\'t exists.');
        } else {
          logger.error('Unable to connect to the database:', err);
          process.exit(1);
        }
      });
      return dfd.promise;
    }
  };
};