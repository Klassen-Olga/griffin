let express=require('express');
let app=express();

let http=require("http").createServer(app);

let Router= require('./core/router');
let router = new Router(app);
router.setRoutes();
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


http.listen(3000, '127.0.0.1', function () {
	console.log('App listening at http://localhost:3000');
});