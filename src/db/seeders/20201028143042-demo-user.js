'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('user', [{
			id: 1,
			firstName: 'Bob',
			lastName: 'Smith',
			email: 'b.smith@fh-erfurt.de',
			createdAt: new Date(),
			updatedAt: new Date(),
			passwordHash: '$2b$10$/QOxg3XkAA5jXYXb2hjoTO2cZASgVqQBFEFuxMOtgn7Qz.9ROSZaq'
		},
			{
				id: 2,
				firstName: 'Robby',
				lastName: 'Smith',
				email: 'r.smith@fh-erfurt.de',
				createdAt: new Date(),
				updatedAt: new Date(),
				passwordHash: '$2b$10$/QOxg3XkAA5jXYXb2hjoTO2cZASgVqQBFEFuxMOtgn7Qz.9ROSZaq'//bycrypt 123456
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('user', null, {});
	}
};
