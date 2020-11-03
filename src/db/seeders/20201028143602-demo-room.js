'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('room', [{
			id: 1,
			uuid: 'a76f6b90-bea8-41b9-82fc-dcd32a8dcf54',
			startDateTime: new Date(),
			numberOfUsers:2,
			createdAt: new Date(),
			updatedAt: new Date()

		}], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('room', null, {});
	}
};
