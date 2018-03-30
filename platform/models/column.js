const Sequelize = require('sequelize');

module.exports = {
    name: 'sys_column',
    label: 'Column',
    schema: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        table: {
            type: Sequelize.UUID
        },
        name: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.STRING
        }
    }
};