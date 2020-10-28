'use strict';
module.exports = (sequelize, DataTypes) => {
	const UserInRoom = sequelize.define('UserInRoom', {}, {tableName: 'userInRoom'});

	UserInRoom.associate = function (models) {
		UserInRoom.belongsTo(models.User, {
			as: 'users',
			foreignKey: 'userId'
		});
		UserInRoom.belongsTo(models.Room, {
			as: 'rooms',
			foreignKey: 'roomId'
		});
	};
	return UserInRoom;
};