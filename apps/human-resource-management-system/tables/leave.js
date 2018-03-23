const Sequelize = require('sequelize');

module.exports = {
    name: 'leave',
    label: 'Leave',
    schema: {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        type: {
            type: Sequelize.STRING
        }
    }
};