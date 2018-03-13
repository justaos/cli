const Sequelize = require('sequelize');

module.exports = {
    name: 'application',
    schema: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        name: {
            type: Sequelize.STRING
        },
        order: {
            type: Sequelize.INTEGER
        }
    }
};