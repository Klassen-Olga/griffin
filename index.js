let express = require('express');
let app = express();
let http = require("http").createServer(app);

app.use(express.static('public'));
app.set('view engine', 'ejs');

let Router = require('./core/router');
let router = new Router(app);
router.setRoutes();

let io = require('socket.io')(http);
const { v4:uuidv4} = require('uuid');

let uuid= uuidv4();
console.log(uuid);
router.updateRoutes(uuid);

let SocketHandler=require('./core/socket');
let socketHandler=new SocketHandler(io);
http.listen(3000, '127.0.0.1', function () {
	console.log('App listening at http://localhost:3000/broadcast\nApp listening at http://localhost:3000/watch' +
		'\nApp listening at http://localhost:3000/room' +
		'\nApp listening at http://localhost:3000/videoChat');
});
