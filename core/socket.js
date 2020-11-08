const Register = require('../lib/register.js');
let userRegister = new Register();
const HelperKurento = require('../helpers/socketKurentoHelper');
let helperKurento = new HelperKurento(userRegister);
const SocketHelper = require('../helpers/socketHelper');


class SocketHandler {

	constructor(io, db) {
		const self = this;
		self.io = io;
		self.database = db;
		self.socketHelper = new SocketHelper(db);
		//object for sockets
		self.sockets = {};
		self.participantsById = {};
		self.participantsByName = {};
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


			socket.on('message', async message => {
				console.log(`Connection: %s receive message`, message.id);

				switch (message.id) {
					case 'joinRoom':
						//insert in both tables participant and participant in room
						if (message.role==='participant'){
							let dbRoom= await self.socketHelper.findRoom(message.roomName);
							let error= await self.socketHelper.insertInBothTables(message.name, socket, dbRoom);
							if (error){
								socket.emit('onEnterNotification', error);
								return;
							}
						}
						helperKurento.joinRoom(socket, message, err => {
							if (err) {
								console.log(`join Room error ${err}`);
							}
						});
						break;
					case 'receiveVideoFrom':
						helperKurento.receiveVideoFrom(socket, message.sender, message.sdpOffer, (err) => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'leaveRoom':
						helperKurento.leaveRoom(socket, err => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'onIceCandidate':
						helperKurento.addIceCandidate(socket, message, err => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'chatMessage':
						helperKurento.sendChatMessageToRoomParticipants(message.message, message.roomId, socket.id, message.toId, (err) => {
							if (err) {
								console.log(err);
								return;
							}
							if (!message.toId) {
								console.log('Sending chat message from ' + socket.id + " to the room " + message.roomId);
							} else {
								console.log('Sending chat message from ' + socket.id + 'to ' + message.toId + " to the room " + message.roomId);

							}
						})
						break;
					case 'requestForModerator':
						let uuid = message.roomName;
						await self.socketHelper.proceedRequestForModerator(message.name, uuid, socket, message.dbId);
						break;
					case 'moderatorResponse':
						socket.to(message.userId).emit('message', message);
						break;
					case 'videoDisabled':
						helperKurento.sendVideoOffOrOnMessageToAllParticipants(message.roomId, socket.id, 'off');
						break;
					case 'videoEnabled':
						helperKurento.sendVideoOffOrOnMessageToAllParticipants(message.roomId, socket.id, 'on');
						break;
				}
			});
		});
	}


	initEventsPeerConnection() {
		const self = this;
		self.io.on('connection', (socket) => {
			// 1)
			socket.on("newUser", async (roomId, fullName, role) => {
				//insert in both tables participant and participantInRoom if not moderator
				if (role === 'participant') {
					let dbRoom = await self.socketHelper.findRoom(roomId);
					if (dbRoom instanceof Error) {
						socket.emit('databaseError', 'Database error:' + dbRoom);
						return;
					}
					let error = await self.socketHelper.insertInBothTables(fullName, socket, dbRoom);
					if (error) {
						socket.emit('databaseError', 'Database error:' + error);
						return;
					}
				}

				console.log("newUser " + socket.id + " sends data to all users");
				self.participantsById[socket.id] = fullName;
				self.participantsByName[fullName] = socket.id;
				socket.join(roomId);
				console.log('Number of participants: ' + socket.adapter.rooms[roomId].length + ' in room ' + roomId);
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
			socket.on("offer", (oldUserId, message, fullName, videoOn) => {
				console.log("offer from new " + socket.id + " to old user " + oldUserId);

				socket.to(oldUserId).emit("offer", socket.id, message, fullName, videoOn);
			});
			// 4) this is only for me to register another users
			socket.on("answer", (newUserId, message, videoBeforeEnterTheRoom) => {
				console.log("answer from " + socket.id + " to new " + newUserId);

				socket.to(newUserId).emit("answer", socket.id, message, self.participantsById[socket.id], videoBeforeEnterTheRoom);
			});
			socket.on("candidate", (id, message) => {
				console.log("new candidate " + id + " for " + socket.id);

				socket.to(id).emit("candidate", socket.id, message);
			});

			socket.on('chat message', (msg, roomId, fromName, toId) => {
				console.log('message: ' + msg);
				let data = {
					message: msg,
					fromName: fromName
				}

				// is id set, send to certain user and sender
				if (toId) {
					socket.to(toId).emit('chat message', data);
					socket.emit('chat message', data);
				}
				//otherwise to everyone
				else {
					self.io.in(roomId).emit('chat message', data);
				}
			});
			socket.on('requestForModeratorPeer', async (fullName, roomId, dbId) => {
				if (socket.adapter.rooms[roomId] && socket.adapter.rooms[roomId].length === config.maxUsersNumberPeerConnection) {
					socket.emit('participantsNumberError', 'Maximum number of users in this chat is reached');
					return;
				}
				await self.socketHelper.proceedRequestForModerator(fullName, roomId, socket, dbId);
			});
			socket.on('moderatorResponsePeer', (accepted, userId) => {
				socket.to(userId).emit('moderatorResponsePeer', accepted);
			});
			socket.on('videoDisabled', roomId => {
				socket.broadcast.to(roomId).emit('videoDisabled', socket.id);
			});
			socket.on('videoEnabled', roomId => {
				socket.broadcast.to(roomId).emit('videoEnabled', socket.id);
			});

		});
	}


	initOtherEvents() {
		const self = this;
		self.io.on('connection', socket => {
			self.sockets[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log('User ' + socket.id + ' disconnects');
				let currentSocket = userRegister.getById(socket.id);
				if (currentSocket) {
					helperKurento.leaveRoom(socket, err => {
						if (err) {
							console.error(err);
						}
						socket.emit('disconn');
					});
				}
				if (self.sockets[socket.id]) {
					delete self.sockets[socket.id];
				}


			});
		})
	}
}

module.exports = SocketHandler;
