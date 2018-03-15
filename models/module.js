const Sequelize = require('sequelize');

module.exports = {
    name: 'module',
    schema: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        name: {
            type: Sequelize.STRING
        },
        parent: {
            type: Sequelize.UUID
        },
        application: {
            type: Sequelize.UUID
        },
        order: {
            type: Sequelize.INTEGER
        }
    }
};