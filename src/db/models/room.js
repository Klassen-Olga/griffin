'use strict';
module.exports = (sequelize, DataTypes) => {
	const Room = sequelize.define('Room', {
		uuid: {
			type: DataTypes.STRING,
			allowNull: false
		},
		startDateTime: {
			type: DataTypes.DATE,
			allowNull: false
		},
		numberOfUsers: {
			type: DataTypes.STRING,
			allowNull: false
		}
	},{tableName: 'room'});

	Room.associate = function (models) {
		Room.hasMany(models.ParticipantInRoom, {
			as: 'allParticipantsInRoom',
			foreignKey: 'roomId'
		});
		Room.hasMany(models.Message, {
			as: 'allMessagesInRoom',
			foreignKey: 'roomId'
		});
	};
	return Room;
};