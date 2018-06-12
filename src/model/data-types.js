const Sequelize = require('sequelize');
const mongoose = require('mongoose');

const STRING = {
  valueOf: () => {
    return 'string';
  },
  getType: () => {
    return mongoose.Schema.Types.String;
  }
};

const INTEGER = {
  valueOf: () => {
    return 'integer';
  },
  getType: () => {
    return mongoose.Schema.Types.Number;
  }
};

module.exports = {
  STRING,
  INTEGER
};