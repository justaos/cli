const bcrypt = require('bcrypt-nodejs');
const fs = require('fs');
const Sequelize = require('sequelize');

const SEQUELIZE_TYPES = {
	'STRING': Sequelize.STRING,
	'TEXT': Sequelize.TEXT,
	'UUID': Sequelize.UUID,
	'INTERGER': Sequelize.INTERGER
};

module.exports = {
	// generating a hash
	convertToScheme: function (json) {
		let that = this;
		let schema = {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.UUIDV4
			}
		};
		json.columns.forEach(function(col){
			let colDef = {};
			colDef.type = that.getSequelizeType(col.type);
			schema[col.name] = colDef;
		});
		return schema;
	},

	getSequelizeType: function(type) {
		if(SEQUELIZE_TYPES[type])
			return SEQUELIZE_TYPES[type];
		return Sequelize.STRING;
	},

	// checking if password is valid
	validPassword: function (password, hashedPwd) {
		return bcrypt.compareSync(password, hashedPwd);
	}
};