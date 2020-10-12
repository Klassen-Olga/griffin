let express = require('express');
let app = express();
let http = require("http").createServer(app);
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
let Router = require('./core/router');
let router = new Router(app);
router.setRoutes();

let io = require('socket.io')(http);
const {v4: uuidv4} = require('uuid');

let uuid = uuidv4();
router.updateRoutes(uuid);

let SocketHandler = require('./core/socket');
/*let socketHandler = new SocketHandler(io);*/

/*
*
* kurento
* */
var minimist = require('minimist');
var kurento = require('kurento-client');

const Register = require('./lib/register.js');
const Session = require('./lib/session.js');
let userRegister = new Register();

let rooms = {};

var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});
io.on('connection', socket => {

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
				joinRoom(socket, message, err => {
					if (err) {
						console.log(`join Room error ${err}`);
					}
				});
				break;
			case 'receiveVideoFrom':
				receiveVideoFrom(socket, message.sender, message.sdpOffer, (err) => {
					if (err) {
						console.error(err);
					}
				});
				break;
			case 'leaveRoom':
				leaveRoom(socket, err => {
					if (err) {
						console.error(err);
					}
				});
				break;
			case 'onIceCandidate':
				addIceCandidate(socket, message, err => {
					if (err) {
						console.error(err);
					}
				});
				break;

		}
	});

});


function joinRoom(socket, message, callback) {
	getRoom(message.roomName, (error, room) => {
		if (error) {
			callback(error);
			return;
		}
		join(socket, room, message.name, (err, user) => {
			console.log(`join success : ${user.name}`);
			if (err) {
				callback(err);
				return;
			}
			callback();
		});
	});
}


function getRoom(roomName, callback) {
	let room = rooms[roomName];

	if (room == null) {
		console.log(`create new room : ${roomName}`);
		getKurentoClient((error, kurentoClient) => {
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

				rooms[roomName] = room;
				callback(null, room);
			});
		});
	} else {
		console.log(`get existing room : ${roomName}`);
		callback(null, room);
	}
}

function join(socket, room, userName, callback) {

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
			roomName: room.name
		});

		// register user to room
		room.participants[userSession.name] = userSession;

		callback(null, userSession);
	});
}


// receive video from sender
function receiveVideoFrom(socket, senderName, sdpOffer, callback) {
	let userSession = userRegister.getById(socket.id);
	let sender = userRegister.getByName(senderName);

	getEndpointForUser(userSession, sender, (error, endpoint) => {
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


function leaveRoom(socket, callback) {
	var userSession = userRegister.getById(socket.id);

	if (!userSession) {
		return;
	}

	var room = rooms[userSession.roomName];

	if(!room){
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
		delete rooms[userSession.roomName];
	}
	delete userSession.roomName;

	callback();
}


/**
 * getKurento Client
 *
 * @param {function} callback
 */
function getKurentoClient(callback) {
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
function addIceCandidate(socket, message, callback) {
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



function getEndpointForUser(userSession, sender, callback) {

	if (userSession.name === sender.name) {
		return callback(null, userSession.outgoingMedia);
	}

	let incoming = userSession.incomingMedia[sender.name];

	if (incoming == null) {
		console.log(`user : ${userSession.name} create endpoint to receive video from : ${sender.name}`);

		// getRoom
		getRoom(userSession.roomName, (error, room) => {
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



/*
var kurentoClient = null;
// queue for ice candidates received before the creation of a Kurento Endpoint.
var iceCandidateQueues = {};
var participants={};
var pipeline={};
// constants
var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});
// express routing
app.use(express.static('public'))


// signaling
io.on('connection', function (socket) {
	console.log('a user connected');

	socket.on('joinRoom',()=>{
		joinRoom(socket);
	})
	socket.on('receiveVideoFrom',(userid, sdpOffer)=>{
		getEndpointForUser(userid, socket, (err, endpoint) => {


			endpoint.processOffer(sdpOffer, (err, sdpAnswer) => {
				if (err) {
					return callback(err);
				}

				socket.emit('receiveVideoAnswer', sdpAnswer, userid);

				var part=participants;
				endpoint.gatherCandidates(err => {
					if (err) {
						return callback(err);
					}
				});
			});
		})
	})
	socket.on('message', function (message) {

		switch (message.event) {

			case 'candidate':
				addIceCandidate(socket, message.userid, message.roomName, message.candidate, err => {
					if (err) {
						console.log(err);
					}
				});
				break;
		}

	});
});
function joinRoom(socket) {
	getRoom(socket, (err) => {

		pipeline.create('WebRtcEndpoint', (err, outgoingMedia) => {

			var user = {
				id: socket.id,
				outgoingMedia: outgoingMedia,
				incomingMedia: {}
			}

			let iceCandidateQueue = iceCandidateQueues[user.id];

			if (iceCandidateQueue) {
				console.error(`user: ${user.id} collect candidate for outgoing media`);
				while (iceCandidateQueue.length) {
					let ice = iceCandidateQueue.shift();
					user.outgoingMedia.addIceCandidate(ice.candidate);
				}
			}

			user.outgoingMedia.on('OnIceCandidate', event => {
				let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
				socket.emit('message', {
					event: 'candidate',
					userid: user.id,
					candidate: candidate
				});
			});


			socket.broadcast.emit('newParticipantArrived', user.id);

			let existingUsers = [];
			for (let i in participants) {
				if (participants[i].id != user.id) {
					existingUsers.push({
						id: participants[i].id,
						name: participants[i].name
					});
				}
			}
			socket.emit('existingParticipants', existingUsers, user.id);
			participants[user.id] = user;
		});
	});
}


function addIceCandidate(socket, senderid, roomname, iceCandidate, callback) {
	let user = participants[socket.id];
	if (user != null) {
		let candidate = kurento.register.complexTypes.IceCandidate(iceCandidate);
		if (senderid == user.id) {
			console.info('Sending candidate for ' + socket.id);

			if (user.outgoingMedia) {
				user.outgoingMedia.addIceCandidate(candidate);
			} else {
				console.info('Queueing candidate for ' + socket.id);

				iceCandidateQueues[user.id].push({candidate: candidate});
			}
		} else {
			console.info('Candidate for ' + socket.id+ " from "+ senderid);

			if (user.incomingMedia[senderid]) {
				user.incomingMedia[senderid].addIceCandidate(candidate);
			} else {
				if (!iceCandidateQueues[senderid]) {
					iceCandidateQueues[senderid] = [];
				}
				iceCandidateQueues[senderid].push({candidate: candidate});
			}
		}
		callback(null);
	} else {
		callback(new Error("addIceCandidate failed"));
	}
}

function clearCandidatesQueue(sessionId) {
	if (iceCandidateQueues[sessionId]) {
		delete iceCandidateQueues[sessionId];
	}
}
function getRoom(socket, callback) {


	// first client arrives
	if (Object.keys(participants).length === 0) {
		socket.join('1', () => {
			//create new room
			//create new kurento pipeline
			getKurentoClient((error, kurento) => {
				kurento.create('MediaPipeline', (err, _pipeline) => {

					pipeline = _pipeline;
					callback(null);
				});
			});
		});
	} else {
		socket.join('1');
		callback(null);
	}
}
function getEndpointForUser(senderid, socket, callback) {
	var asker = participants[socket.id];
	var sender = participants[senderid];

	if (asker.id === sender.id) {
		return callback(null, asker.outgoingMedia);
	}

	if (asker.incomingMedia[sender.id]) {
		sender.outgoingMedia.connect(asker.incomingMedia[sender.id], err => {
			if (err) {
				return callback(err);
			}
			callback(null, asker.incomingMedia[sender.id]);
		});
	} else {
		pipeline.create('WebRtcEndpoint', (err, incoming) => {
			if (err) {
				return callback(err);
			}

			asker.incomingMedia[sender.id] = incoming;

			let iceCandidateQueue = iceCandidateQueues[sender.id];
			if (iceCandidateQueue) {
				console.error(`user: ${sender.id} collect candidate for outgoing media`);
				while (iceCandidateQueue.length) {
					let ice = iceCandidateQueue.shift();
					incoming.addIceCandidate(ice.candidate);
				}
			}

			incoming.on('OnIceCandidate', event => {
				let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
				socket.emit('message', {
					event: 'candidate',
					userid: sender.id,
					candidate: candidate
				});
			});

			sender.outgoingMedia.connect(incoming, err => {
				callback(null, incoming);
			});
		});
	}
}

//getting the Kurento Client reference from
// the media server and set the listener for the application on port 3000
function getKurentoClient(callback) {
	if (kurentoClient !== null) {
		return callback(null, kurentoClient);
	}

	kurento(argv.ws_uri, function (error, _kurentoClient) {
		if (error) {
			console.log("Could not find media server at address " + argv.ws_uri);
			return callback("Could not find media server at address" + argv.ws_uri
				+ ". Exiting with error " + error);
		}

		kurentoClient = _kurentoClient;
		callback(null, kurentoClient);
	});
}
*/


http.listen(3000, '127.0.0.1', function () {
	console.log(
		'\nApp listening at http://localhost:3000/register' +
		'\nApp listening at http://localhost:3000/kurentoManyToMany' +
		'\nApp listening at http://localhost:3000/videoChat');
});
