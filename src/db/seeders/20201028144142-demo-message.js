'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('message', [{
			id: 1,
			text: 'Anyone here?',
			fromId: 1,
			toId: null,
			roomId: 1,
			createdAt: new Date(),
			updatedAt: new Date()

		},
			{
				id: 2,
				text: 'I am here, Bob',
				fromId: 2,
				toId: 1,
				roomId: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('message', null, {});
	}
};
