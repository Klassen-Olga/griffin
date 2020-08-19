require('dotenv').config();
module.exports = {
	development: {
		username: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'griffinDB',
		host: process.env.DB_HOST || 'localhost',
		dialect: 'mysql',
		port: process.env.DB_PORT || '3307'
	},
	test: {
		username: 'root',
		password: '',
		database: 'griffinDB',
		host: 'localhost',
		dialect: 'mysql',
		port: '3307'
	},
	production: {
		username: 'root',
		password: '',
		database: 'griffinDB',
		host: 'localhost',
		dialect: 'mysql',
		port: '3307'
	}
}
