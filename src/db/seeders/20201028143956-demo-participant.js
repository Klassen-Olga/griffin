'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('participant', [
			{
				id: 1,
				fullName: 'Bob Smith',
				socketId: 'AAAA',
				moderatorId: 1,
				createdAt: new Date(),
				updatedAt: new Date()

			},
			{
				id: 2,
				fullName: 'Margo Limb',
				socketId: 'BBBB',
				moderatorId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('participant', null, {});
	}
};
