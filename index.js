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
var candidatesQueue = {};
var presenter = null;
var viewers = [];
var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000/kurentoOneToOne',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});

io.on('connection', socket => {

	socket.on('presenter', (offer) => {
		clearCandidatesQueue(socket.id);

		presenter = {
			id: socket.id,
			pipeline: null,
			webRtcEndpoint: null
		}
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


				presenter.pipeline = pipeline;
				// .create() - point where application communicates with media server AS--->KMS
				//webrtsEndPoint - result returned from KMS AS<---KMS
				pipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {

					if (err) {
						console.error(err);
					}

					presenter.webRtcEndpoint = webRtcEndpoint;

					if (candidatesQueue[socket.id]) {
						while (candidatesQueue[socket.id].length) {
							var candidate = candidatesQueue[socket.id].shift();
							webRtcEndpoint.addIceCandidate(candidate);
						}
					}
					webRtcEndpoint.on('OnIceCandidate', event => {
						var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

						socket.emit('iceCandidate', candidate);

					});
					webRtcEndpoint.processOffer(offer, function (error, sdpAnswer) {
						if (error) {
							console.error(err);
						}
						socket.emit('presenterResponse', sdpAnswer);
					});
					webRtcEndpoint.gatherCandidates(function (error) {
						if (error) {
							console.error(err);
						}
					});
				})
			})
		});
	});

	socket.on('viewer', (offer) => {

		clearCandidatesQueue(socket.id);
		presenter.pipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {

			if (err) {
				console.error(err);
			}

			viewers[socket.id] = {
				"webRtcEndpoint": webRtcEndpoint,
				"id": socket.id
			}

			if (candidatesQueue[socket.id]) {
				while (candidatesQueue[socket.id].length) {
					var candidate = candidatesQueue[socket.id].shift();
					webRtcEndpoint.addIceCandidate(candidate);
				}
			}

			webRtcEndpoint.on('OnIceCandidate', event => {
				var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

				socket.emit('iceCandidate', candidate);

			});

			webRtcEndpoint.processOffer(offer, function (error, sdpAnswer) {
				if (error) {
					console.error(err);
				}

				presenter.webRtcEndpoint.connect(webRtcEndpoint, function (err) {
					socket.emit('viewerResponse', sdpAnswer);

				});
				webRtcEndpoint.gatherCandidates(function (error) {
					if (error) {
						console.error(err);
					}
				});

			});


		})
	})


//receive candidate from client and save to candidate list of user and add to endpoint
	socket.on('onIceCandidate', _candidate => {
		var candidate = kurento.getComplexType('IceCandidate')(_candidate);

		// existing user receives new candidate
		if (presenter.id == socket.id && presenter.webRtcEndpoint) {
			console.info('Sending candidate for ' + socket.id);
			presenter.webRtcEndpoint.addIceCandidate(candidate);
		} else if (viewers[socket.id] && viewers[socket.id].webRtcEndpoint) {
			console.info('Sending candidate for ' + socket.id);
			viewers[socket.id].webRtcEndpoint.addIceCandidate(candidate);
		} else {
			// end point for this user is not available yet,
			// candidates will be stored in queue and then will enter in first if
			console.info('Queueing candidate for ' + socket.id);

			if (!candidatesQueue[socket.id]) {
				candidatesQueue[socket.id] = [];
			}
			candidatesQueue[socket.id].push(candidate);
		}
	});
	socket.on('stop',()=>{
		if (presenter!==null && presenter.id===socket.id){
			viewers.forEach(viewer =>{
				socket.broadcast.to(viewer.id).emit('stopCommunication');
			});
			presenter.pipeline.release();
			presenter=null;
			viewers=[];
		}
		else if (viewers[socket.id]){
			viewers[socket.id].webRtcEndpoint.release();
			delete viewers[socket.id];
		}
	})
});

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


http.listen(3000, '127.0.0.1', function () {
	console.log(
		'\nApp listening at http://localhost:3000/register' +
		'\nApp listening at http://localhost:3000/kurentoOneToMany' +
		'\nApp listening at http://localhost:3000/videoChat');
});
