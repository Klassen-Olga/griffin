var kurento = require('kurento-client');
var minimist = require('minimist');


const Session = require('../lib/session.js');

var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000',
		ws_uri: 'ws://ec2-54-157-113-30.compute-1.amazonaws.com:8888/kurento'
	}
});

module.exports = class Helper {

	constructor(userRegister) {
		const self = this;
		self.rooms = {};
		self.userRegister = userRegister;
	}

	joinRoom(socket, message, callback) {
		const self = this;

		self.getRoom(message.roomName, (error, room) => {
			if (error) {
				callback(error);
				return;
			}
			self.join(socket, room, message, (err, user) => {
				console.log(`join success : ${socket.id}`);
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
						kurentoClient: kurentoClient,
						moderator: 'Klassen Olga'
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

	join(socket, room, message, callback) {

		const self = this;
		// add user to session
		let userSession = new Session(socket, message.name, room.name, message.videoOn,
			message.audioOn, message.videoBeforeEnterTheRoom);

		// register
		self.userRegister.register(userSession);


		room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
			if (error) {
				console.error('no participant in room');
				if (Object.keys(room.participants).length === 0) {
					room.pipeline.release();
				}
				return callback(error);
			}

			outgoingMedia.setTurnUrl("klassen.olga@fh-erfurt.de:123@158.69.221.198:3478");
			// else
			outgoingMedia.setMaxVideoRecvBandwidth(100);
			outgoingMedia.setMinVideoRecvBandwidth(20);
			userSession.setOutgoingMedia(outgoingMedia);

			// add ice candidate the get sent before endpoint is established
			// socket.id : room iceCandidate Queue
			let iceCandidateQueue = userSession.iceCandidateQueue[userSession.id];
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
					userId: userSession.id,
					candidate: candidate
				});
			});

			// notify other user that new user is joing
			// participants- object of user sessions
			let usersInRoom = room.participants;
			for (let i in usersInRoom) {
				if (usersInRoom[i].id !== userSession.id) {
					usersInRoom[i].sendMessage({
						id: 'newParticipantArrived',
						userId: userSession.id,
						name: userSession.name,
						videoOn: message.videoOn,
						audioOn: message.audioOn,
						videoBeforeEnterTheRoom: message.videoBeforeEnterTheRoom
					});
				}
			}

			// send list of current user in the room to current participant
			let existingUsers = [];
			for (let i in usersInRoom) {
				if (usersInRoom[i].id !== userSession.id) {
					existingUsers.push({
						name: usersInRoom[i].name,
						userId: usersInRoom[i].id,
						videoOn: usersInRoom[i].videoOn,
						audioOn: usersInRoom[i].audioOn,
						videoBeforeEnterTheRoom: usersInRoom[i].videoBeforeEnterTheRoom
					});
				}
			}
			userSession.sendMessage({
				id: 'existingParticipants',
				data: existingUsers,
				roomName: room.name,
				userId: socket.id,
				videoOn: message.videoOn,
				audioOn: message.audioOn
			});

			// register user to room
			room.participants[userSession.id] = userSession;

			callback(null, userSession);
		});
	}


// receive video from sender
	receiveVideoFrom(socket, senderId, sdpOffer, callback) {
		const self = this;

		let userSession = self.userRegister.getById(socket.id);
		let sender = self.userRegister.getById(senderId);

		self.getEndpointForUser(userSession, sender, (error, endpoint) => {
			if (error) {
				callback(error);
			}

			endpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
				console.log(`process offer from ${senderId} to ${userSession.id}`);
				if (error) {
					return callback(error);
				}
				let data = {
					id: 'receiveVideoAnswer',
					userId: sender.id,
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


	sendChatMessageToRoomParticipants(message, roomId, userId, toId, callback) {
		const self = this;
		let userSession = self.userRegister.getById(userId);

		let room = self.rooms[userSession.roomName];
		if (!userSession || !room || (roomId !== room.name)) {
			return callback('Incorrect room name or room does not exist');
		}



		let data = {
			id: 'chat message',
			message: message,
			fromName: userSession.name,
			fromId: userId
		}
		if(toId){
			self.userRegister.getById(userId).sendMessage(data);
			self.userRegister.getById(toId).sendMessage(data);
		}
		else{
			let usersInRoom = room.participants;
			for (let key in usersInRoom) {
				usersInRoom[key].sendMessage(data);
			}
		}


		return callback(null);

	}

	leaveRoom(socket, callback) {
		const self = this;

		var userSession = self.userRegister.getById(socket.id);

		if (!userSession) {
			return;
		}


		var room = self.rooms[userSession.roomName];

		if (!room) {
			return;
		}

		console.log('notify all user that ' + userSession.id + ' is leaving the room ' + room.name);
		var usersInRoom = room.participants;
		delete usersInRoom[userSession.id];
		userSession.outgoingMedia.release();

		// release incoming media for the leaving user
		for (var i in userSession.incomingMedia) {
			userSession.incomingMedia[i].release();
			delete userSession.incomingMedia[i];
		}

		var data = {
			id: 'participantLeft',
			userId: userSession.id
		};
		for (var i in usersInRoom) {
			var user = usersInRoom[i];
			// release viewer from this
			user.incomingMedia[userSession.id].release();
			delete user.incomingMedia[userSession.id];

			// notify all user in the room
			user.sendMessage(data);
		}

		// Release pipeline and delete room when room is empty
		if (Object.keys(room.participants).length === 0) {
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
		const self = this;

		let user = self.userRegister.getById(socket.id);
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

		if (userSession.id === sender.id) {
			return callback(null, userSession.outgoingMedia);
		}

		let incoming = userSession.incomingMedia[sender.id];

		if (incoming == null) {
			console.log(`user : ${userSession.id} create endpoint to receive video from : ${sender.id}`);

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
					incomingMedia.setMaxVideoSendBandwidth(100);
					incomingMedia.setMaxVideoSendBandwidth(20);
					userSession.incomingMedia[sender.id] = incomingMedia;
					incomingMedia.setTurnUrl("klassen.olga@fh-erfurt.de:123@158.69.221.198:3478");

					// add ice candidate the get sent before endpoints is establlished
					let iceCandidateQueue = userSession.iceCandidateQueue[sender.id];
					if (iceCandidateQueue) {
						while (iceCandidateQueue.length) {
							let message = iceCandidateQueue.shift();
							console.log(`user: ${userSession.id} collect candidate for ${message.data.sender}`);
							incomingMedia.addIceCandidate(message.candidate);
						}
					}

					incomingMedia.on('OnIceCandidate', event => {
						console.log(`generate incoming media candidate: ${userSession.id} from ${sender.id}`);
						let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
						userSession.sendMessage({
							id: 'iceCandidate',
							userId: sender.id,
							candidate: candidate
						});
					});
					sender.outgoingMedia.connect(incomingMedia, error => {
						if (error) {
							callback(error);
						}
						callback(null, incomingMedia);
					});

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

	proceedRequestForModerator(message, socket) {
		const self = this;

		let data1 = {
			id: 'onEnterNotification',
			error: null
		}
		//does room exist in database
		//get moderator from db
		if (/*self.rooms.hasOwnProperty(message.roomName)*/true === false) {
			data1.error = 'Please check if the url is entered correctly';
			socket.emit('message', data1);
			return;
		}

		//vremenno, potom id brati iz rooms moderator
		let moderatorDb = 'Olga Klassen';
		let roomDb = message.roomName;

		//does user exists in db
		if (true) {
			// is current user moderator
			if (moderatorDb === message.name) {
				socket.emit('message', data1);
				return;
			}
		}

		let moderator = self.userRegister.getByName(moderatorDb);
		// after all is room empty or isn't moderator already registered
		if (Object.keys(self.rooms).length === 0 || typeof moderator === 'undefined') {
			data1.error = 'No moderator present, please reenter later';
			socket.emit('message', data1);
			return;
		}

		let data = {
			id: 'requestForModerator',
			userId: socket.id,
			name: message.name
		}
		socket.emit('message', {id: 'waitModeratorResponse'});
		socket.to(moderator.id).emit('message', data);
	}

	sendVideoOffOrOnMessageToAllParticipants(roomId, userId, offOrOnFlag) {
		const self = this;
		let room = self.rooms[roomId];
		let participants = room.participants;
		let data = {
			id: (offOrOnFlag === 'off') ? 'videoDisabled' : 'videoEnabled',
			userId: userId
		}
		if (offOrOnFlag === 'off') {
			self.userRegister.getById(userId).videoBeforeEnterTheRoom = false;
		}
		for (let key in participants) {
			if (participants[key].id !== userId) {
				participants[key].sendMessage(data);
			}
		}

	}


}