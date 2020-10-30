const Sequelize = require('sequelize');
const fs =require('fs');
const path=require('path');
module.exports= function (){
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
	const db = {
		Sequelize: Sequelize,
		sequelize: sequelize
	};
	let modelsPath=path.join(__dirname, '..', 'src', 'db', 'models');
	let files =fs.readdirSync(modelsPath);
	files=files.filter(file=>{
		return (file.indexOf('.')!==0 && file.slice(-3)==='.js');
	});
	files.forEach(file=>{
		const model=require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
		db[model.name]=model;
	});
	Object.keys(db).forEach(modelName=>{
		try{
			let filePath=path.join(__dirname, '..', 'models', modelName + '.js');
			if(fs.existsSync(filePath)){
				require(filePath)(db[modelName], db);
			}
		}catch (e) {
			console.error(e);
		}
		if(db[modelName].associate){
			db[modelName].associate(db);
		}
	});
	return db;
}
