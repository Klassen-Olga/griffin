'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('userInRoom', [{
			id: 1,
			userId: 1,
			roomId:1,
			createdAt: new Date(),
			updatedAt: new Date()

		},
			{
				id:2,
				userId: 2,
				roomId: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('userInRoom', null, {});
	}
};
