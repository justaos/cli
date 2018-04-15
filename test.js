const Sequelize = require('sequelize');

let sequelize = new Sequelize('anysolsd', 'root', 'root', {
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

sequelize.authenticate().then(() => {
  console.log('Database connection has been established successfully.');
}).catch(err => {
  if (err.original.code === 'ER_BAD_DB_ERROR') {
    console.log('unown db');
  }
  else {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }
});