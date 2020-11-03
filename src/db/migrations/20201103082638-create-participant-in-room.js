'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('participantInRoom', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			participantId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'participant'
					},
					key: 'id'
				},
				allowNull: false
			},
			roomId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'room'
					},
					key: 'id'
				},
				allowNull: false
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
	down: async (queryInterface, Sequelize) => {
		await queryInterface.dropTable('participantInRoom');
	}
}