const Sequelize = require('sequelize');

const sequelize = new Sequelize('anysols', 'root', 'root', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        //prevent sequelize from pluralizing table namesN
        freezeTableName: true
    },
    operatorsAliases: false
});

module.exports = sequelize;