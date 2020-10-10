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

var kurentoClient = null;
// queue for ice candidates received before the creation of a Kurento Endpoint.
var iceCandidateQueues = {};
var participants={};
var pipeline={};
// constants
var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000/ManyToMany',
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
/*
var minimist = require('minimist');
var kurento = require('kurento-client');

var kurentoClient = null;
var candidatesQueue = [];

var participants = {};
var myPipeline = null;
var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000/kurentoManyToMany',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});

function createPipeline(callback) {
	getKurentoClient((err, kurentoClient) => {

		if (err) {
			console.error(err);
		}

		// .create() - point where application communicates with media server AS--->KMS
		//pipeline- result returned from KMS AS<---KMS
		kurentoClient.create('MediaPipeline', (err, pipeline) => {
			if (err) {
				console.error(err);
			}

			myPipeline = pipeline;
			callback();

		})
	})
}
function joinRoom(callback){
	if (Object.keys(participants).length === 0) {
		createPipeline(() => {
			callback();
		})

	}
	else{
		callback();
	}
}
io.on('connection', socket => {

	socket.on('joinRoom', () => {

		joinRoom(()=>{
			// .create() - point where application communicates with media server AS--->KMS
			//webrtsEndPoint - result returned from KMS AS<---KMS
			myPipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {

				if (err) {
					console.error(err);
				}

				var user = {
					id: socket.id,
					webRtcEndpoint: webRtcEndpoint,
					webRtcEndpoints: {}
				}

				if (candidatesQueue[socket.id]) {
					console.error(`user: ${user.id} collect candidate for outgoing media`);
					while (candidatesQueue[socket.id].length) {
						var candidate = candidatesQueue[socket.id].shift();
						user.webRtcEndpoint.addIceCandidate(candidate);
					}
				}
				user.webRtcEndpoint.on('OnIceCandidate', event => {
					var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

					socket.emit('candidate', candidate, user.id);

				});
				socket.broadcast.emit('newParticipant', socket.id);
				let existingUsers = [];
				for (let i in participants) {
					if (participants[i].id !== user.id) {
						existingUsers.push({
							id: participants[i].id
						});
					}
				}
				socket.emit('existingParticipants', user.id, existingUsers);
				participants[user.id] = user;

			})

		})

	});
	// offer from user to connect to kurento media server
	socket.on('offer', (offer, userId) => {
		getEndPoint(userId, socket, (err, webRtcEndpoint) => {
			webRtcEndpoint.processOffer(offer, function (error, sdpAnswer) {
				if (error) {
					console.error(err);
				}
				socket.emit('answer', sdpAnswer, userId);
			});
			webRtcEndpoint.gatherCandidates(function (error) {
				if (error) {
					console.error(err);
				}
			});
		});
	});
//receive candidate from client and save to candidate list of user and add to endpoint
	socket.on('candidate', (_candidate, fromId) => {
		if (participants[socket.id]===null){
			return;
		}

		var candidate = kurento.getComplexType('IceCandidate')(_candidate);
		if (fromId===socket.id){

			if (participants[socket.id].webRtcEndpoint){
				console.info('Sending candidate for ' + socket.id);

				participants[socket.id].webRtcEndpoint.addIceCandidate(_candidate);
			}
			else{
				console.info('Queueing candidate for ' + socket.id);
				if (!candidatesQueue[socket.id]) {
					candidatesQueue[socket.id] = [];
				}
				candidatesQueue[socket.id].push(candidate);
			}
		}
		else{
			console.info('Candidate for ' + socket.id+ " from "+ fromId);

			if (participants[socket.id].webRtcEndpoints[fromId]){
				participants[socket.id].webRtcEndpoints[fromId].addIceCandidate(_candidate);
			}
			else{
				if (!candidatesQueue[fromId]) {
					candidatesQueue[fromId] = [];
				}
				candidatesQueue[fromId].push(candidate);
			}
		}
	});
	socket.on('stop', () => {
		if (presenter !== null && presenter.id === socket.id) {
			viewers.forEach(viewer => {
				socket.broadcast.to(viewer.id).emit('stopCommunication');
			});
			presenter.pipeline.release();
			presenter = null;
			viewers = [];
		} else if (viewers[socket.id]) {
			viewers[socket.id].webRtcEndpoint.release();
			delete viewers[socket.id];
		}
	});



})


function getEndPoint(from, socket, callback) {
	let fromParticipant = participants[from];
	let toParticipant = participants[socket.id];
	// is the same user- should only process answer
	if (fromParticipant.id === toParticipant.id) {
		return callback(null, toParticipant.webRtcEndpoint);
	}
	// had user1 already processed media from user2, should only user 2 process media from user1
	if (toParticipant.webRtcEndpoints[fromParticipant.id]) {
		fromParticipant.webRtcEndpoint.connect(toParticipant.webRtcEndpoints[fromParticipant.id], err => {
			if (err) {
				console.error(err);
			}
			callback(null, toParticipant.webRtcEndpoints[fromParticipant.id]);
		})
	} else {
		myPipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {

			if (err) {
				console.error(err);
			}

			toParticipant.webRtcEndpoints[fromParticipant.id]=webRtcEndpoint;

			if (candidatesQueue[socket.id]) {
				console.error(`user: ${from} collect candidate for outgoing media`);

				while (candidatesQueue[socket.id].length) {
					var candidate = candidatesQueue[socket.id].shift();
					webRtcEndpoint.addIceCandidate(candidate);
				}
			}
			webRtcEndpoint.on('OnIceCandidate', event => {
				var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

				socket.emit('candidate', candidate, from);

			});

			fromParticipant.webRtcEndpoint.connect(webRtcEndpoint, err=>{
				if (err){
					console.log(err);
				}
				callback(null, webRtcEndpoint);
			})

		})
	}
}



function clearCandidatesQueue(sessionId) {
	if (candidatesQueue[sessionId]) {
		delete candidatesQueue[sessionId];
	}
}

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
