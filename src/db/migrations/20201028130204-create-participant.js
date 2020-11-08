'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('participant', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			fullName: {
				type: Sequelize.STRING,
				allowNull: false
			},
			socketId: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true
			},
			userId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'user'
					},
					key: 'id'
				},
				allowNull: true
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			}
		});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable('participant');
	}
};