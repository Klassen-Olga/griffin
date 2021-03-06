'use strict';
module.exports = (sequelize, DataTypes) => {
	const Message = sequelize.define('Message', {
		text: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {tableName: 'message'});
	Message.associate = function (models) {
		// associations can be defined here
		Message.belongsTo(models.Participant, {
			as: 'from',
			foreignKey: 'fromId'
		});
		Message.belongsTo(models.Participant, {
			as: 'to',
			foreignKey: 'toId'
		});
		Message.belongsTo(models.Room, {
			as: 'inRoom',
			foreignKey: 'roomId'
		});
	};
	return Message;
};
