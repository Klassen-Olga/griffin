'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('participantInRoom', [{
			id: 1,
			participantId: 1,
			roomId:1,
			createdAt: new Date(),
			updatedAt: new Date()

		},
			{
				id:2,
				participantId: 2,
				roomId: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('participantInRoom', null, {});
	}
};

