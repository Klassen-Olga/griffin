'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('user', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			firstName: {
				type: Sequelize.STRING,
				allowNull: false
			},
			lastName: {
				type: Sequelize.STRING,
				allowNull: false
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false
			},
			passwordHash:{
				type: Sequelize.STRING(255),
				allowNull:true
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			permissions:{
				allowNull:false,
				type:Sequelize.INTEGER,
				defaultValue:0,
				comment:'bitmask of permission from 2^0 until 2^30'
			}
		});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable('user');
	}
};