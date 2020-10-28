'use strict';
module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('User', {
		firstName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false
		},
		passwordHash: {
			type: DataTypes.STRING(255),
			allowNull: true
		}
	}, {
		tableName: 'user'
	});
	User.associate = function (models) {
		// moderator
		User.hasMany(models.Room, {
			as: 'userCreatedRooms',
			foreignKey: 'moderatorId'
		});

		// can be in multiple rooms at the same time
		User.hasMany(models.UserInRoom, {
			as: 'allUsers',
			foreignKey: 'userId'
		});
		User.hasMany(models.Message, {
			as: 'messageTo',
			foreignKey: 'toId'
		});
		User.hasMany(models.Message, {
			as: 'messageFrom',
			foreignKey: 'fromId'
		});

	};
	return User;
};