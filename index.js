let express = require('express');
let app = express();
let http = require("http").createServer(app);

app.use(express.static('public'));

let Router = require('./core/router');
let router = new Router(app);
router.setRoutes();

let io = require('socket.io')(http);

let SocketHandler=require('./core/socket');
let socketHandler=new SocketHandler(io);
http.listen(3000, '127.0.0.1', function () {
	console.log('App listening at http://localhost:3000/broadcast\nApp listening at http://localhost:3000/watch' +
		'\nApp listening at http://localhost:3000/duplex' +
		'\nApp listening at http://localhost:3000/example');
});