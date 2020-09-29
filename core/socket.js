class SocketHandler {

	constructor(io) {
		const self = this;
		self.io = io;
		//object for sockets
		self.sockets = {};
		self.initEvents();


		///

		self.broadcasters={};

	}

	activateChat(){
		io.on('connection', (socket) => {
			socket.on('chat message', (msg) => {
				console.log('message: ' + msg);
				io.emit('chat message', msg);
			});

		});
	}
	initEvents() {
		const self = this;
		self.io.on('connection', (socket) => {
/*			self.sockets[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log("Broadcaster: "+this.broadcaster);
				console.log('disconnect client', socket.id)
				if (self.sockets[socket.id]) {
					//deletes object property
					delete self.sockets[socket.id];
				}
			});
			console.log(socket.id);
			socket.on("broadcaster", () => {
				self.broadcaster = socket.id;
				socket.broadcast.emit("broadcaster");
			});
			socket.on("watcher", () => {
				console.log("SERVERwATCHER");
				socket.to(self.broadcaster).emit("watcher", socket.id);
			});
			socket.on("offer", (id, message) => {
				socket.to(id).emit("offer", self.broadcaster, message);
			});
			socket.on("answer", (id, message) => {
				socket.to(self.broadcaster).emit("answer", socket.id, message);
			});
			socket.on("candidate", (id, message) => {
				socket.to(id).emit("candidate", socket.id, message);
			});
			socket.on("candidateOfB", (id, message) => {
				socket.to(id).emit("candidateOfB", socket.id, message);
			});
			socket.on("candidateOfW", (id, message) => {
				socket.to(id).emit("candidateOfW", socket.id, message);
			});
			socket.on("disconnect", () => {
				socket.to(self.broadcaster).emit("disconnectPeer", socket.id);
			});*/
			self.broadcasters[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log('disconnect client', socket.id)
				if (self.broadcasters[socket.id]) {
					delete self.broadcasters[socket.id];
				}
			});
			console.log(socket.id);
			socket.on("broadcaster", () => {
				socket.broadcast.emit("broadcaster");
			});
			socket.on("watcher", () => {
				console.log("SERVERwATCHER");
				socket.broadcast.emit("watcher", socket.id);
			});
			//making offer to specific watcher
			socket.on("offer", (watcherId, message) => {
				socket.to(watcherId).emit("offer",watcherId, message, socket.id);
			});
			//send answer from specific watcher
			socket.on("answer", (watcherId, message) => {
				socket.broadcast.emit("answer", socket.id, message);
			});
			socket.on("candidate", (id, message) => {
				socket.to(id).emit("candidate", socket.id, message);
			});
			socket.on("disconnect", () => {
				socket.emit("disconnectPeer", socket.id);
			});

		});
	}
}

module.exports = SocketHandler;