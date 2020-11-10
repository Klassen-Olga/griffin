'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('room', [
			{
				id: 1,
				uuid: '7408e0e1-f8c2-41e0-9f4c-fcecc351e0ad',
				startDateTime: new Date(),
				moderatorId: 1,
				numberOfUsers: 3,
				createdAt: new Date(),
				updatedAt: new Date()

			},
			{
				id: 2,
				uuid: '47fce5c0-deae-4587-8aea-d6200ff742b7',
				startDateTime: new Date(),
				moderatorId: 1,
				numberOfUsers: 10,
				createdAt: new Date(),
				updatedAt: new Date()

			},
			{
				id: 3,
				uuid: 'a76f6b90-bea8-41b9-82fc-dcd32a8dcf54',
				startDateTime: new Date(),
				moderatorId: 2,
				numberOfUsers: 3,
				createdAt: new Date(),
				updatedAt: new Date()

			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('room', null, {});
	}
};
