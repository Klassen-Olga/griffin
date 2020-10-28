'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('message', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			text: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			fromId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'user'
					},
					key: 'id'
				},
				allowNull: false
			},
			toId: {
				type: Sequelize.INTEGER,
				references: {
					model: {
						tableName: 'user'
					},
					key: 'id'
				},
				allowNull: true
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
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable('message');
	}
};