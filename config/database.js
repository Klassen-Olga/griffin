require('dotenv').config();
module.exports = {
	development: {
		username: process.env.DB_USER || 'lg2g812x6tpzhjyu',
		password: process.env.DB_PASSWORD || 'g41yyeiv2nw2d1bv',
		database: process.env.DB_NAME || 'cs7b61hp4mb2wjxm',
		host: process.env.DB_HOST || 'lt80glfe2gj8p5n2.chr7pe7iynqr.eu-west-1.rds.amazonaws.com',
		dialect: 'mysql',
		port: process.env.DB_PORT || '3306'
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
