'use strict';
module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('User', {
		firstName:{
			type: DataTypes.STRING,
			allowNull: false
		},
		lastName:{
			type: DataTypes.STRING,
			allowNull: false
		},
		email:{
			type: DataTypes.STRING,
			allowNull: false
		},
		passwordHash:{
			type: DataTypes.STRING(255),
			allowNull:true
		},
		permissions:{
			allowNull:false,
			type:DataTypes.INTEGER,
			defaultValue:0,
			comment:'bitmask of permission from 2^0 until 2^30'
		}
	}, {
		tableName:'user'
	});
	User.associate = function (models) {
		User.hasMany(models.Message);

	};
	return User;
};