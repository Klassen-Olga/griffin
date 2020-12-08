let express = require('express');
let app = express();
let http = require("http").createServer(app);
const bodyParser = require('body-parser');
let layouts=require('express-ejs-layouts');

app.use(express.static('public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(layouts);
// another layout can be set in render parameters for each action method e.g. layout: 'layout2'
app.set('layout', 'layout');
app.set('view engine', 'ejs');

var path = require('path')
var favicon = require('serve-favicon');
//app.use(favicon(path.join(__dirname, 'public', '/favicon.ico')));
app.use(favicon(__dirname + '/favicon.ico'));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
global.config=require('./config/config');

const database  =   require('./core/database')();
let Router = require('./core/router');
let router = new Router(app, database);
router.setRoutes();

let io = require('socket.io')(http);



let SocketHandler = require('./core/socket');
let socketHandler = new SocketHandler(io,database);


let SocketHelper= require('./helpers/socketHelper');
let socketHelper=new SocketHelper(database);


http.listen(process.env.PORT ||3000, function () {
	console.log(
		'\nApp listening at http://localhost:3000/room/47fce5c0-deae-4587-8aea-d6200ff742b7/3' +
		'\nApp listening at http://localhost:3000/room/7408e0e1-f8c2-41e0-9f4c-fcecc351e0ad/10' +
		'\nApp listening at http://localhost:3000/login' );
});
