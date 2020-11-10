'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('participantInRoom', [
			{
				id: 1,
				participantId: 1,
				roomId: 1,
				createdAt: new Date(),
				updatedAt: new Date()

			},
			{
				id: 2,
				participantId: 2,
				roomId: 3,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 3,
				participantId: 3,
				roomId: 2,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 4,
				participantId: 4,
				roomId: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 5,
				participantId: 5,
				roomId: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 6,
				participantId: 6,
				roomId: 3,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 7,
				participantId: 7,
				roomId: 2,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 8,
				participantId: 8,
				roomId: 2,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 9,
				participantId: 9,
				roomId: 2,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('participantInRoom', null, {});
	}
};

