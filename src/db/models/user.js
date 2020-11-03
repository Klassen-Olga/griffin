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
		User.hasOne(models.Participant, {
			as: 'moderatorIsParticipant',
			foreignKey: 'moderatorId'
		});

	};
	return User;
};