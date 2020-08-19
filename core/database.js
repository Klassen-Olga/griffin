
const Sequelize = require('sequelize');
const sequelize=new Sequelize('griffinDB', 'root', '', {
	host:'localhost',
	port:'3307',
	dialect:'mysql',
	pool:{
		max:5,//max 5 connections
		min:0,//min 0 connections
		acquire:30000,//The maximum time, in milliseconds, that pool will try to get connection before throwing error
		idle:10000//The maximum time, in milliseconds, that pool is not used till it will be closed
	}
});