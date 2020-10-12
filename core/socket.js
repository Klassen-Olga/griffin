const {v4: uuidv4} = require('uuid');
var minimist = require('minimist');
var kurento = require('kurento-client');

const Register = require('../lib/register.js');
const Session = require('../lib/session.js');
let userRegister = new Register();


var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});
class SocketHandler {

	constructor(io) {
		const self = this;
		self.io = io;
		//object for sockets
		self.sockets = {};
		self.rooms = {};
		self.initOtherEvents();


	}

	initEventsKurento() {
		const self = this;
		self.io.on('connection', socket => {

			// error handle
			socket.on('error', err => {
				console.error(`Connection %s error : %s`, socket.id, err);
			});

			socket.on('disconnect', data => {
				console.log(`Connection : %s disconnect`, data);
			});

			socket.on('message', message => {
				console.log(`Connection: %s receive message`, message.id);

				switch (message.id) {
					case 'joinRoom':
						self.joinRoom(socket, message, err => {
							if (err) {
								console.log(`join Room error ${err}`);
							}
						});
						break;
					case 'receiveVideoFrom':
						self.receiveVideoFrom(socket, message.sender, message.sdpOffer, (err) => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'leaveRoom':
						self.leaveRoom(socket, err => {
							if (err) {
								console.error(err);
							}
						});
						break;
					case 'onIceCandidate':
						self.addIceCandidate(socket, message, err => {
							if (err) {
								console.error(err);
							}
						});
						break;

				}
			});

		});
	}

	joinRoom(socket, message, callback) {
		const self = this;

		self.getRoom(message.roomName, (error, room) => {
			if (error) {
				callback(error);
				return;
			}
			self.join(socket, room, message.name, (err, user) => {
				console.log(`join success : ${user.name}`);
				if (err) {
					callback(err);
					return;
				}
				callback();
			});
		});
	}


	getRoom(roomName, callback) {
		const self = this;

		let room = self.rooms[roomName];

		if (room == null) {
			console.log(`create new room : ${roomName}`);
			self.getKurentoClient((error, kurentoClient) => {
				if (error) {
					return callback(error);
				}

				kurentoClient.create('MediaPipeline', (error, pipeline) => {
					if (error) {
						return callback(error);
					}
					room = {
						name: roomName,
						pipeline: pipeline,
						participants: {},
						kurentoClient: kurentoClient
					};

					self.rooms[roomName] = room;
					callback(null, room);
				});
			});
		} else {
			console.log(`get existing room : ${roomName}`);
			callback(null, room);
		}
	}

	join(socket, room, userName, callback) {

		// add user to session
		let userSession = new Session(socket, userName, room.name);

		// register
		userRegister.register(userSession);


		room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
			if (error) {
				console.error('no participant in room');
				if (Object.keys(room.participants).length === 0) {
					room.pipeline.release();
				}
				return callback(error);
			}

			// else
			outgoingMedia.setMaxVideoRecvBandwidth(300);
			outgoingMedia.setMinVideoRecvBandwidth(100);
			userSession.setOutgoingMedia(outgoingMedia);


			// add ice candidate the get sent before endpoint is established
			// socket.id : room iceCandidate Queue
			let iceCandidateQueue = userSession.iceCandidateQueue[userSession.name];
			if (iceCandidateQueue) {
				while (iceCandidateQueue.length) {
					let message = iceCandidateQueue.shift();
					console.error(`user: ${userSession.id} collect candidate for outgoing media`);
					userSession.outgoingMedia.addIceCandidate(message.candidate);
				}
			}

			// ICE
			// listener
			userSession.outgoingMedia.on('OnIceCandidate', event => {
				// ka ka ka ka ka
				// console.log(`generate outgoing candidate ${userSession.id}`);
				let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
				userSession.sendMessage({
					id: 'iceCandidate',
					name: userSession.name,
					candidate: candidate
				});
			});

			// notify other user that new user is joing
			let usersInRoom = room.participants;
			for (let i in usersInRoom) {
				if (usersInRoom[i].name != userSession.name) {
					usersInRoom[i].sendMessage({
						id: 'newParticipantArrived',
						name: userSession.name
					});
				}
			}

			// send list of current user in the room to current participant
			let existingUsers = [];
			for (let i in usersInRoom) {
				if (usersInRoom[i].name != userSession.name) {
					existingUsers.push(usersInRoom[i].name);
				}
			}
			userSession.sendMessage({
				id: 'existingParticipants',
				data: existingUsers,
				roomName: room.name/*, name:userName*/
			});

			// register user to room
			room.participants[userSession.name] = userSession;

			callback(null, userSession);
		});
	}


// receive video from sender
	receiveVideoFrom(socket, senderName, sdpOffer, callback) {
		const self = this;

		let userSession = userRegister.getById(socket.id);
		let sender = userRegister.getByName(senderName);

		self.getEndpointForUser(userSession, sender, (error, endpoint) => {
			if (error) {
				callback(error);
			}

			endpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
				console.log(`process offer from ${senderName} to ${userSession.id}`);
				if (error) {
					return callback(error);
				}
				let data = {
					id: 'receiveVideoAnswer',
					name: sender.name,
					sdpAnswer: sdpAnswer
				};
				userSession.sendMessage(data);

				endpoint.gatherCandidates(error => {
					if (error) {
						return callback(error);
					}
				});

				return callback(null, sdpAnswer);
			});
		});
	}


	leaveRoom(socket, callback) {
		const self = this;

		var userSession = userRegister.getById(socket.id);

		if (!userSession) {
			return;
		}

		var room = self.rooms[userSession.roomName];

		if (!room) {
			return;
		}

		console.log('notify all user that ' + userSession.id + ' is leaving the room ' + room.name);
		var usersInRoom = room.participants;
		delete usersInRoom[userSession.name];
		userSession.outgoingMedia.release();

		// release incoming media for the leaving user
		for (var i in userSession.incomingMedia) {
			userSession.incomingMedia[i].release();
			delete userSession.incomingMedia[i];
		}

		var data = {
			id: 'participantLeft',
			name: userSession.name
		};
		for (var i in usersInRoom) {
			var user = usersInRoom[i];
			// release viewer from this
			user.incomingMedia[userSession.name].release();
			delete user.incomingMedia[userSession.name];

			// notify all user in the room
			user.sendMessage(data);
		}

		// Release pipeline and delete room when room is empty
		if (Object.keys(room.participants).length == 0) {
			room.pipeline.release();
			delete self.rooms[userSession.roomName];
		}
		delete userSession.roomName;

		callback();
	}


	/**
	 * getKurento Client
	 *
	 * @param {} callback
	 */
	getKurentoClient(callback) {
		kurento(argv.ws_uri, (error, kurentoClient) => {
			if (error) {
				let message = `Could not find media server at address ${wsUrl}`;
				return callback(`${message} . Exiting with error ${error}`);
			}
			callback(null, kurentoClient);
		});
	}

	/**
	 * Add ICE candidate, required for WebRTC calls
	 *
	 * @param {*} socket
	 * @param {*} message
	 * @param {*} callback
	 */
	addIceCandidate(socket, message, callback) {
		let user = userRegister.getById(socket.id);
		if (user != null) {
			// assign type to IceCandidate
			let candidate = kurento.register.complexTypes.IceCandidate(message.candidate);
			user.addIceCandidate(message, candidate);
			callback();
		} else {
			console.error(`ice candidate with no user receive : ${message.sender}`);
			callback(new Error("addIceCandidate failed."));
		}
	}


	getEndpointForUser(userSession, sender, callback) {
		const self = this;

		if (userSession.name === sender.name) {
			return callback(null, userSession.outgoingMedia);
		}

		let incoming = userSession.incomingMedia[sender.name];

		if (incoming == null) {
			console.log(`user : ${userSession.name} create endpoint to receive video from : ${sender.name}`);

			// getRoom
			self.getRoom(userSession.roomName, (error, room) => {
				if (error) {
					return callback(error);
				}
				// 　create WebRtcEndpoint for sender user
				room.pipeline.create('WebRtcEndpoint', (error, incomingMedia) => {

					if (error) {
						if (Object.keys(room.participants).length === 0) {
							room.pipeline.release();
						}
						return callback(error);
					}

					console.log(`user: ${userSession.id} successfully create pipeline`);
					incomingMedia.setMaxVideoRecvBandwidth(300);
					incomingMedia.setMinVideoRecvBandwidth(100);
					userSession.incomingMedia[sender.name] = incomingMedia;


					// add ice candidate the get sent before endpoints is establlished
					let iceCandidateQueue = userSession.iceCandidateQueue[sender.name];
					if (iceCandidateQueue) {
						while (iceCandidateQueue.length) {
							let message = iceCandidateQueue.shift();
							console.log(`user: ${userSession.name} collect candidate for ${message.data.sender}`);
							incomingMedia.addIceCandidate(message.candidate);
						}
					}

					incomingMedia.on('OnIceCandidate', event => {
						// ka ka ka ka ka
						// console.log(`generate incoming media candidate: ${userSession.id} from ${sender.name}`);
						let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
						userSession.sendMessage({
							id: 'iceCandidate',
							name: sender.name,
							candidate: candidate
						});
					});
					sender.outgoingMedia.connect(incomingMedia, error => {
						if (error) {
							callback(error);
						}
						callback(null, incomingMedia);
					});

					/*sender.hubPort.connect(incomingMedia);

					callback(null, incomingMedia);*/
				});
			})
		} else {
			console.log(`user: ${userSession.id} get existing endpoint to receive video from: ${sender.id}`);
			sender.outgoingMedia.connect(incoming, error => {
				if (error) {
					callback(error);
				}
				callback(null, incoming);
			});
		}
	}


	initEvents() {
		const self = this;
		self.io.on('connection', (socket) => {
			self.sockets[socket.id] = socket;

			socket.on('disconnect', () => {
				console.log('disconnect client', socket.id)
				if (self.sockets[socket.id]) {
					delete self.sockets[socket.id];
				}
			});
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



		});
	}
	initOtherEvents(){
		const self=this;
		self.io.on('connection', socket=>{
			/*
			* CHAT EVENTS
			* */
			socket.on('chat message', (msg, roomId) => {
				console.log('message: ' + msg);
				self.io.in(roomId).emit('chat message', msg);
			});

			/*
			* Link generator event
			* */

			socket.on('uuid', () => {
				socket.emit('uuid', uuidv4());
			});
		})
	}
}

module.exports = SocketHandler;
