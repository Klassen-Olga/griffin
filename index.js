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

http.listen(3000, '127.0.0.1', function () {
	console.log(
		'\nApp listening at http://localhost:3000/room/a76f6b90-bea8-41b9-82fc-dcd32a8dcf54/3' +
		'\nApp listening at http://localhost:3000/room/a76f6b90-bea8-41b9-82fc-hhhhhhhdcd32a8dcf54/4' +
		'\nApp listening at http://localhost:3000/login' );
});
