let express=require('express');
let app=express();

let http=require("http").createServer(app);

let Router= require('./core/router');
let router = new Router(app);
router.setRoutes();

http.listen(3000, '127.0.0.1', function () {
	console.log('App listening at http://localhost:3000');
});