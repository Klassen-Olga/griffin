let express = require('express');
let app = express();
let http = require("http").createServer(app);

app.use(express.static('public'));

let Router = require('./core/router');
let router = new Router(app);
router.setRoutes();

let io = require('socket.io')(http);
/*let activateChat=require('./core/socket');
activateChat(io);*/
let broadcaster;


io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
	console.log(socket.id);
	socket.on("broadcaster", () => {
		broadcaster = socket.id;
		socket.broadcast.emit("broadcaster");
	});
	socket.on("watcher", () => {
		socket.to(broadcaster).emit("watcher", socket.id);
	});
	socket.on("offer", (id, message) => {
		socket.to(id).emit("offer", socket.id, message);
	});
	socket.on("answer", (id, message) => {
		socket.to(id).emit("answer", socket.id, message);
	});
	socket.on("candidate", (id, message) => {
		socket.to(id).emit("candidate", socket.id, message);
	});
	socket.on("disconnect", () => {
		socket.to(broadcaster).emit("disconnectPeer", socket.id);
	});
});


http.listen(3000, '127.0.0.1', function () {
	console.log('App listening at http://localhost:3000/broadcast\nApp listening at http://localhost:3000/watch');
});