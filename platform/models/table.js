const Sequelize = require('sequelize');

module.exports = {
    name: 'sys_table',
    label: 'Table',
    schema: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        name: {
            type: Sequelize.STRING
        },
        label: {
            type: Sequelize.STRING
        }
    }
};