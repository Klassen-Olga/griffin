'use strict';
module.exports = (sequelize, DataTypes) => {
	const Room = sequelize.define('Room', {
		uuid: {
			type: DataTypes.STRING,
			allowNull: false
		},
		startDateTime: {
			type: DataTypes.Date,
			allowNull: false
		},
		numberOfUsers: {
			type: DataTypes.STRING,
			allowNull: false
		}
	},{tableName: 'room'});

	Room.associate = function (models) {
		Room.belongsTo(models.User, {
			as: 'roomsCreated',
			foreignKey: 'moderatorId'
		});
		Room.hasMany(models.UserInRoom, {
			as: 'allUsersInRoom',
			foreignKey: 'roomId'
		});
		Room.hasMany(models.Message, {
			as: 'allMessagesInRoom',
			foreignKey: 'roomId'
		});
	};
	return Room;
};