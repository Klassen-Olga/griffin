class SocketHandler {

	constructor(io) {
		const self = this;
		self.io = io;
		//object for sockets
		self.sockets = {};
		self.initEvents();
	}

	initEvents() {
		const self = this;
		self.io.on('connection', (socket) => {
			self.sockets[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log('disconnect client', socket.id)
				if (self.sockets[socket.id]) {
					//deletes object property
					delete self.sockets[socket.id];
				}
			});
			console.log(socket.id);
			// 1)
			socket.on("newUser", () => {
				socket.broadcast.emit("newUser");
			});
			// 1)
			socket.on("requestForOffer", () => {
				socket.broadcast.emit("requestForOffer", socket.id);
			});
			// 2)
			socket.on("offer", (watcherId, message) => {
				socket.to(watcherId).emit("offer",socket.id, message);
			});
			// 4) this is only for me to register another users
			socket.on("answer", (message) => {
              socket.broadcast.emit("answer", socket.id, message);
			});
			socket.on("candidate", (id, message) => {
			  console.log("candidate-server" + id)
				socket.to(id).emit("candidate", socket.id, message);
			});
			socket.on("disconnect", () => {
				socket.broadcast.emit("disconnectPeer", socket.id);
			});


		});
	}
}

module.exports = SocketHandler;
