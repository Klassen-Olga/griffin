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
var sessions = {};

// constants
var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000/kurentoExampleHelloWorld',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});

io.on('connection', socket=>{
	socket.on('onIceCandidate', _candidate=>{
		var candidate = kurento.getComplexType('IceCandidate')(_candidate);

		if (sessions[socket.id]) {
			console.info('Sending candidate');
			var webRtcEndpoint = sessions[socket.id].webRtcEndpoint;
			webRtcEndpoint.addIceCandidate(candidate);
		}
		else {
			console.info('Queueing candidate');
			if (!candidatesQueue[socket.id]) {
				candidatesQueue[socket.id] = [];
			}
			candidatesQueue[socket.id].push(candidate);
		}
	});
	socket.on('start', offer=>{

		getKurentoClient((error, kurentoClient)=>{

			kurentoClient.create('MediaPipeline', (err, pipeline)=>{
				pipeline.create('WebRtcEndpoint', (err, webRtcEndpoint)=>{

					if (candidatesQueue[socket.id]) {
						while(candidatesQueue[socket.id].length) {
							var candidate = candidatesQueue[socket.id].shift();
							webRtcEndpoint.addIceCandidate(candidate);
						}
					}
					webRtcEndpoint.connect(webRtcEndpoint, err=>{
						webRtcEndpoint.on('OnIceCandidate', event=>{
							var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

							socket.emit('iceCandidate', candidate);
						});
						webRtcEndpoint.processOffer(offer, (error, answer)=>{
							sessions[socket.id] = {
								'pipeline' : pipeline,
								'webRtcEndpoint' : webRtcEndpoint
							}
							socket.emit('startResponse', answer);
						});
						webRtcEndpoint.gatherCandidates(function(error) {
							if (error) {
								console.log(error);
							}
						});
					});

				})
			})
		});

	})
});
function getKurentoClient(callback) {
	if (kurentoClient !== null) {
		return callback(null, kurentoClient);
	}

	kurento(argv.ws_uri, function(error, _kurentoClient) {
		if (error) {
			console.log("Could not find media server at address " + argv.ws_uri);
			return callback("Could not find media server at address" + argv.ws_uri
				+ ". Exiting with error " + error);
		}

		kurentoClient = _kurentoClient;
		callback(null, kurentoClient);
	});
}

// express routing


http.listen(3000, '127.0.0.1', function () {
	console.log(
		'\nApp listening at http://localhost:3000/register' +
		'\nApp listening at http://localhost:3000/kurentoExampleHelloWorld' +
		'\nApp listening at http://localhost:3000/videoChat');
});
