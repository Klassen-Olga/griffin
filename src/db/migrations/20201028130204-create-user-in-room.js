'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('userInRoom', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			userId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'user'
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
		await queryInterface.dropTable('userInRoom');
	}
};