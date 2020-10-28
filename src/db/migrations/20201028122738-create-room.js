'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('room', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			uuid: {
				type: Sequelize.STRING,
				allowNull: false
			},
			startDateTime: {
				type: Sequelize.DATE,
				allowNull: false
			},
			moderatorId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'user'
					},
					key: 'id'
				},
				allowNull: false
			},
			numberOfUsers: {
				type: Sequelize.INTEGER,
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
		await queryInterface.dropTable('room');
	}
};