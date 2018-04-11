const bcrypt = require('bcrypt-nodejs');
const fs = require('fs');
const Sequelize = require('sequelize');

const SEQUELIZE_TYPES = {
	'STRING': Sequelize.STRING,
	'TEXT': Sequelize.TEXT,
	'UUID': Sequelize.UUID,
	'INTEGER': Sequelize.INTEGER,
	'BOOLEAN': Sequelize.BOOLEAN
};

module.exports = {
	// generating a hash
	convertToScheme(json) {
		let that = this;
		let schema = {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.UUIDV4
			}
		};
		json.columns.forEach(function (col) {
			let colDef = {};
			colDef.type = that.getSequelizeType(col.type);
			schema[col.name] = colDef;
		});
		return schema;
	},

	upsert(model, values, condition) {
		return model.findOne({where: condition}).then(function (obj) {
			if (obj) // update
				return obj.update(values);
			else  // insert
				return model.create(values);
		});
	},

	getSequelizeType(type) {
		if (SEQUELIZE_TYPES[type])
			return SEQUELIZE_TYPES[type];
		return Sequelize.STRING;
	},

	// checking if password is valid
	validPassword(password, hashedPwd) {
		return bcrypt.compareSync(password, hashedPwd);
	}
};