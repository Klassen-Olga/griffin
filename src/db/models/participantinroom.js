'use strict';
module.exports = (sequelize, DataTypes) => {
	const ParticipantInRoom = sequelize.define('ParticipantInRoom', {}, {tableName: 'participantInRoom'});

	ParticipantInRoom.associate = function (models) {
		ParticipantInRoom.belongsTo(models.Participant, {
			as: 'participants',
			foreignKey: 'participantId'
		});
		ParticipantInRoom.belongsTo(models.Room, {
			as: 'rooms',
			foreignKey: 'roomId'
		});
	};
	return ParticipantInRoom;
};