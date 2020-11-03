'use strict';
module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('Participant', {
		fullName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		socketId: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		tableName: 'participant'
	});
	User.associate = function (models) {
		// moderator
		User.belongsTo(models.User, {
			as: 'participantIsModerator',
			foreignKey: 'moderatorId'
		});

		// can be in multiple rooms at the same time
		User.hasMany(models.ParticipantInRoom, {
			as: 'allParticipants',
			foreignKey: 'participantId'
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