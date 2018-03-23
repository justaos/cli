const Sequelize = require('sequelize');

module.exports = {
    name: 'module',
    label: 'Module',
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
        type: {
            type: Sequelize.STRING
        },
        table: {
            type: Sequelize.STRING
        },
        order: {
            type: Sequelize.INTEGER
        }
    }
};