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
var myPipeline=null;
var caller= {
	id:null,
	name:null,
	offer:null,
	webRtcEndpoint: null
};
var callee= {
	id:null,
	name:null,
	offer:null,
	webRtcEndpoint: null
};
// constants
var argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'http://localhost:3000/kurentoExampleHelloWorld',
		ws_uri: 'ws://localhost:8888/kurento'
	}
});
function generateSdpAnswer(callerOrCallee, callback) {

	if (callerOrCallee==='caller'){
		caller.webRtcEndpoint.processOffer(caller.offer,callback);
		caller.webRtcEndpoint.gatherCandidates(function(error) {
			if (error) {
				console.log(error);
			}
		});
	}
	else{
		callee.webRtcEndpoint.processOffer(callee.offer, callback);
		callee.webRtcEndpoint.gatherCandidates(function(error) {
			if (error) {
				console.log(error);
			}
		});
	}

}
function createPipeline(socket, callback){

	getKurentoClient((err, kurentoClient)=>{

		if (err){
			console.error(err);
		}

		// .create() - point where application communicates with media server AS--->KMS
		//pipeline- result returned from KMS AS<---KMS
		kurentoClient.create('MediaPipeline', (err, pipeline)=>{
			if (err){
				console.error(err);
			}


			// .create() - point where application communicates with media server AS--->KMS
			//webrtsEndPoint - result returned from KMS AS<---KMS
			pipeline.create('WebRtcEndpoint', (err, callerWebRtcEndPoint)=>{

				if (err){
					console.error(err);
				}

				if (candidatesQueue[caller.id]) {
					while(candidatesQueue[caller.id].length) {
						var candidate = candidatesQueue[caller.id].shift();
						callerWebRtcEndPoint.addIceCandidate(candidate);
					}
				}
				callerWebRtcEndPoint.on('OnIceCandidate', event=>{
					var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

					socket.broadcast.to(caller.id).emit('iceCandidate', candidate);

				});
				pipeline.create('WebRtcEndpoint', (err,calleeWebRtcEndPoint)=>{

					if (candidatesQueue[callee.id]) {
						while(candidatesQueue[callee.id].length) {
							var candidate = candidatesQueue[callee.id].shift();
							calleeWebRtcEndPoint.addIceCandidate(candidate);
						}
					}
					calleeWebRtcEndPoint.on('OnIceCandidate', event=>{
						var candidate = kurento.getComplexType('IceCandidate')(event.candidate);

						socket.emit('iceCandidate', candidate);

					});

					callerWebRtcEndPoint.connect(calleeWebRtcEndPoint, err=>{
						if (err){
							console.error(err);
						}
						calleeWebRtcEndPoint.connect(callerWebRtcEndPoint, err=>{
							if (err){
								console.error(err);
							}
							myPipeline=pipeline;
							callee.webRtcEndpoint=calleeWebRtcEndPoint;
							caller.webRtcEndpoint=callerWebRtcEndPoint;
							sessions[caller.id]={
								'webRtcEndpoint':callerWebRtcEndPoint,
							}
							sessions[callee.id]={
								'webRtcEndpoint':calleeWebRtcEndPoint
							}
							callback();
						});

					});
				});


			})
		})
	});
}
io.on('connection', socket=>{

	socket.on('start',(callerName, offer)=>{
		clearCandidatesQueue(socket.id);

		caller.name=callerName;
		caller.id=socket.id;
		caller.offer=offer;
		socket.broadcast.emit('incomingCall', callerName);
	});

	socket.on('responseToIncomingCall', (fromName, offer)=>{
		callee.id=socket.id;
		callee.offer=offer;
		clearCandidatesQueue(callee.id);

		createPipeline(socket,()=>{
			generateSdpAnswer('caller', function (err,callerSdpAnswer) {
				generateSdpAnswer('callee', function (err,calleeSdpAnswer) {
					socket.emit('startCommunication', calleeSdpAnswer);
					socket.broadcast.to(caller.id).emit('callResponse', callerSdpAnswer);
				});
			})
		});
	});


	/*socket.on('stop', ()=>{
		if (sessions[socket.id]){
			let pipeline= sessions[socket.id].pipeline;
			console.info('Releasing pipeline');
			pipeline.release();

			delete sessions[socket.id];
			delete candidatesQueue[socket.id];
		}
	});*/
	//receive candidate from client and save to candidate list of user and add to endpoint
	socket.on('onIceCandidate', _candidate=>{
		var candidate = kurento.getComplexType('IceCandidate')(_candidate);

		// existing user receives new candidate
		if (sessions[socket.id]) {
			console.info('Sending candidate for '+socket.id);
			var webRtcEndpoint = sessions[socket.id].webRtcEndpoint;
			webRtcEndpoint.addIceCandidate(candidate);
		}
		else {
			// end point for this user is not available yet,
			// candidates will be stored in queue and then will enter in first if
			console.info('Queueing candidate for '+socket.id);
			if (!candidatesQueue[socket.id]) {
				candidatesQueue[socket.id] = [];
			}
			candidatesQueue[socket.id].push(candidate);
		}
	});
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




http.listen(3000, '127.0.0.1', function () {
	console.log(
		'\nApp listening at http://localhost:3000/register' +
		'\nApp listening at http://localhost:3000/kurentoOneToOne' +
		'\nApp listening at http://localhost:3000/videoChat');
});
