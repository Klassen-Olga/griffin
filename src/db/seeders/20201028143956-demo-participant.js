'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('participant', [
			{
				id: 1,
				fullName: 'Bob Smith',
				socketId: '1AAAA',
				userId: 1,
				createdAt: new Date(),
				updatedAt: new Date()

			},
			{
				id: 2,
				fullName: 'Bob Smith',
				socketId: '2BBBB',
				userId: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 3,
				fullName: 'Dodj Limpopo',
				socketId: '3BBBB',
				userId: 2,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 4,
				fullName: 'Santa Claus',
				socketId: '4BBBB',
				userId: 3,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 5,
				fullName: 'Margo Limb',
				socketId: '5BBBB',
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 6,
				fullName: 'Margo Limb',
				socketId: '6BBBB',
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 7,
				fullName: 'Margo Limb',
				socketId: '7BBBB',
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 8,
				fullName: 'Margo Limb',
				socketId: '8BBBB',
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: 9,
				fullName: 'Margo Limb',
				socketId: '9BBBB',
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			},
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('participant', null, {});
	}
};
