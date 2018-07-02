const config = require('./config');
const Q = require('q');
const logger = require('./logger');
const mongoose = require('mongoose');
const _ = require('lodash');
const Admin = mongoose.mongo.Admin;
mongoose.Promise = Promise;

let db;

class DatabaseConnector {
  constructor() {
  }

  connect() {
    let dfd = Q.defer();
    this._connection = mongoose.createConnection(
        `${config.db.dialect}://${config.db.host}:${config.db.port}/${config.db.name}`);

    this._connection.on('connecting', function() {
      logger.info('trying to establish a connection to mongo');
    });

    this._connection.on('connected', function() {
      logger.info('connection established successfully');
    });

    this._connection.on('error', function(err) {
      logger.error('connection to mongo failed \n' + err);
      dfd.reject(err);
    });

    this._connection.on('open', function() {
      logger.info('mongo db connection open');
      dfd.resolve(this._connection);
    });

    return dfd.promise;
  }

  checkDatabase() {
    let dfd = Q.defer();
    new Admin(this._connection.db).listDatabases().then(function(res) {
      let index = _.findIndex(res.databases, function(db) {
        return db.name === config.db.name;
      });
      if (index !== -1) {
        logger.info('database \'' + config.db.name + '\' exists');
        dfd.resolve();
      }
      else {
        logger.info('database \'' + config.db.name + '\' don\'t exists');
        dfd.reject();
      }
    });
    return dfd.promise;
  }

  dropDatabase() {
    return this._connection.db.dropDatabase();
  }

  closeConnection() {
    this._connection.close();
  }

  getConnection() {
    return this._connection;
  }

  static setInstance(databaseInstance){
    db = databaseInstance;
  }

  static getInstance(){
    return db;
  }

}

module.exports = DatabaseConnector;