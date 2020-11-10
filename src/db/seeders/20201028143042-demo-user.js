'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('user', [
			{
				id: 1,
				firstName: 'Bob',
				lastName: 'Smith',
				email: 'b.smith@gmail.com',
				createdAt: new Date(),
				updatedAt: new Date(),
				passwordHash: '$2b$10$zLBSlLjmLCz1Zxr1Hp0hVuYZdgWVwDK4VTq4928j4PodonFEkEB62'//bcrypt:1111111q
			},
			{
				id: 2,
				firstName: 'Dodj',
				lastName: 'Limpopo',
				email: 'd.limpopo@gmail.com',
				createdAt: new Date(),
				updatedAt: new Date(),
				passwordHash: '$2b$10$zLBSlLjmLCz1Zxr1Hp0hVuYZdgWVwDK4VTq4928j4PodonFEkEB62'//bcrypt:1111111q
			},
			{
				id: 3,
				firstName: 'Santa',
				lastName: 'Claus',
				email: 's.claus@gmail.com',
				createdAt: new Date(),
				updatedAt: new Date(),
				passwordHash: '$2b$10$zLBSlLjmLCz1Zxr1Hp0hVuYZdgWVwDK4VTq4928j4PodonFEkEB62'//bcrypt:1111111q
			}
		], {});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('user', null, {});
	}
};
