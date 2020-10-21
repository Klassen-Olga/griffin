const {v4: uuidv4} = require('uuid');
const Register = require('../lib/register.js');
let userRegister = new Register();
const Helper = require('../helpers/socketKurentoHelper');
let helper = new Helper(userRegister);

class SocketHandler {

	constructor(io) {
		const self = this;
		self.io = io;
		//object for sockets
		self.sockets = {};
		self.participantsById = {};
		self.participantsByName={};
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
							if (err) {
								console.log(err);
								return;
							}
							console.log('Sending chat message from ' + socket.id + " to the room " + message.roomId);
						})
						break;
					case 'requestForModerator':
						helper.proceedRequestForModerator(message, socket);
						break;
					case 'moderatorResponse':
						socket.to(message.userId).emit('message', message);
						break;


				}
			});
		});
	}

	initEventsPeerConnection() {
		const self = this;
		self.io.on('connection', (socket) => {
			// 1)
			socket.on("newUser", (roomId, fullName) => {
				console.log("newUser " + socket.id + " sends data to all users");
				self.participantsById[socket.id] = fullName;
				self.participantsByName[fullName]=socket.id;
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

			socket.on('chat message', (msg, roomId, fromName) => {
				console.log('message: ' + msg);
				let data = {
					message: msg,
					fromName: fromName
				}
				self.io.in(roomId).emit('chat message', data);
			});
			socket.on('requestForModeratorPeer', (fullName, roomId)=>{
				self.proceedRequestForModeratorPeer(fullName, roomId, socket)
			});
			socket.on('moderatorResponsePeer', (accepted, userId)=>{
				socket.to(userId).emit('moderatorResponsePeer', accepted);
			});
			socket.on('videoDisabled', roomId=>{
				socket.broadcast.to(roomId).emit('videoDisabled', socket.id);
			});
			socket.on('videoEnabled', roomId=>{
				socket.broadcast.to(roomId).emit('videoEnabled', socket.id);
			});

		});
	}
	proceedRequestForModeratorPeer(fullName,roomId, socket) {
		const self = this;
		let error=null;
		//does room exist in database
		if (/*self.rooms.hasOwnProperty(message.roomName)*/true === false) {
			socket.emit('onEnterNotification', error);
			return;
		}
		let moderatorDb='Olga Klassen';
		let roomDb=roomId;

		//does user exists in db
		if (true){
			// is current user moderator
			if (moderatorDb === fullName) {
				socket.emit('onEnterNotification', error);
				return;
			}
		}


		let moderator= self.participantsByName['Olga Klassen'];
		let room=socket.adapter.rooms[roomId];
		// after all is room empty or isn't moderator already registered
		if (room.length===0 || typeof moderator==='undefined'){
			error = 'No moderator present, please reenter later';
			socket.emit('onEnterNotification', error);
			return;
		}

		socket.emit('waitModeratorResponse');
		socket.to(moderator).emit('requestForModerator', socket.id, fullName);
	}
	initOtherEvents() {
		const self = this;
		self.io.on('connection', socket => {
			self.sockets[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log('User ' + socket.id + ' disconnects');
				if (userRegister.getById(socket.id)) {
					helper.leaveRoom(socket, err => {
						if (err) {
							console.error(err);
						}
						socket.emit('disconn');
						if (self.sockets[socket.id]) {
							delete self.sockets[socket.id];
						}
					});
				} else {
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
