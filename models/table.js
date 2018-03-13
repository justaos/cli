const Sequelize = require('sequelize');

module.exports = {
    name: 'table',
    schema: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        name: {
            type: Sequelize.STRING
        }
    }
};