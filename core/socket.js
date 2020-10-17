const {v4: uuidv4} = require('uuid');
const Register = require('../lib/register.js');
let userRegister = new Register();
const Helper=require('../helpers/socketKurentoHelper');
let helper= new Helper(userRegister);

class SocketHandler {

	constructor(io) {
		const self = this;
		self.io = io;
		//object for sockets
		self.sockets = {};
		self.initOtherEvents();
		self.initEventsKurento();
		self.initEventsPeerConnection();

	}

	initEventsKurento() {
		const self = this;
		self.io.on('connection', socket => {

			console.log(socket.id);
			// error handle
			socket.on('error', err => {
				console.error(`Connection %s error : %s`, socket.id, err);
			});


			socket.on('message', message => {
				console.log(`Connection: %s receive message`, message.id);

				switch (message.id) {
					case 'joinRoom':
						helper.joinRoom(socket, message, err => {
							if (err) {
								console.log(`join Room error ${err}`);
							}
						});
						break;
					case 'receiveVideoFrom':
						helper.receiveVideoFrom(socket, message.sender, message.sdpOffer, (err) => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'leaveRoom':
						helper.leaveRoom(socket, err => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'onIceCandidate':
						helper.addIceCandidate(socket, message, err => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'chatMessage':
						helper.sendChatMessageToRoomParticipants(message.message, message.roomId, socket.id, (err) => {
							if (err){
								console.log(err);
								return;
							}
							console.log('Sending chat message from ' + socket.id + " to the room " +message.roomId);
						})
						break;

				}
			});
		});
	}

	initEventsPeerConnection() {
		const self = this;
		self.io.on('connection', (socket) => {
			// 1)
			socket.on("newUser", (roomId) => {
				console.log("newUser " + socket.id + " sends data to all users");
				socket.join(roomId);
				socket.broadcast.to(roomId).emit("newUser", socket.id);
				socket.on("disconnect", () => {

					socket.leave(roomId);
					socket.to(roomId).broadcast.emit("disconnectPeer", socket.id);
				});
			});
			// 1)
			socket.on("requestForOffer", (newUserId, fullName) => {
				console.log("requestForOffer from old " + socket.id + " to new " + newUserId);

				socket.to(newUserId).emit("requestForOffer", socket.id, fullName);
			});
			// 2)
			socket.on("offer", (oldUserId, message, fullName) => {
				console.log("offer from new " + socket.id + " to old user " + oldUserId);

				socket.to(oldUserId).emit("offer", socket.id, message, fullName);
			});
			// 4) this is only for me to register another users
			socket.on("answer", (newUserId, message) => {
				console.log("answer from " + socket.id + " to new " + newUserId);

				socket.to(newUserId).emit("answer", socket.id, message);
			});
			socket.on("candidate", (id, message) => {
				console.log("new candidate " + id + " for " + socket.id);

				socket.to(id).emit("candidate", socket.id, message);
			});

			socket.on("mediaOnOffer", (description, userIdToSendHimOffer) => {
				console.log("offer for audio from " + socket.id + "to " + userIdToSendHimOffer);

				socket.to(userIdToSendHimOffer).emit("mediaOnAnswer", socket.id, description);
			});

			/*
			*
			* chat event
			* */
			socket.on('chat message', (msg, roomId, fromName) => {
				console.log('message: ' + msg);
				let data={
					message: msg,
					fromName: fromName
				}
				self.io.in(roomId).emit('chat message', data);
			});

		});
	}

	initOtherEvents() {
		const self = this;
		self.io.on('connection', socket => {
			self.sockets[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log('User '+ socket.id+' disconnects');
				if (userRegister.getById(socket.id)){
					helper.leaveRoom(socket, err => {
						if (err) {
							console.error(err);
						}
						socket.emit('disconn');
						if (self.sockets[socket.id]) {
							delete self.sockets[socket.id];
						}
					});
				}
				else{
					if (self.sockets[socket.id]) {
						delete self.sockets[socket.id];
					}
				}

			});

			socket.on('uuid', () => {
				socket.emit('uuid', uuidv4());
			});
		})
	}
}

module.exports = SocketHandler;
