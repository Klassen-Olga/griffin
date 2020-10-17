window.onbeforeunload = () => {
	socket.close();
};
window.onload=()=>{
	document.getElementById('enterTheRoom').style.display='block';
	document.getElementById('leaveTheRoom').style.display='none';
}
checkUsersDevicesAndAccessPermissions();

/*
* variables for managing device access
* */
var audioDeviceNumber=0;
var videoDeviceNumber=0;
var acceptAudio=false;
var acceptVideo=false;
var audioBeforeEnterTheRoom=false;
var videoBeforeEnterTheRoom=false;
/*
* variables for managing peer connections and users personal data
* */
var socket = null;
var participants = {};
var name = null;
var userId = null;
var selfStream = document.getElementsByName('selfStream')[0];

function socketInit() {
	socket = io();

	socket.on('message', parsedMessage => {
		console.info('Received message: ' + parsedMessage.id);

		switch (parsedMessage.id) {
			case 'disconn':
				participants[userId].disposeSelf();
				socket.close();
				break;
			case 'existingParticipants':
				onExistingParticipants(parsedMessage);
				break;
			case 'newParticipantArrived':
				onNewParticipant(parsedMessage);
				break;
			case 'participantLeft':
				onParticipantLeft(parsedMessage);
				break;
			case 'receiveVideoAnswer':
				receiveVideoResponse(parsedMessage);
				break;
			case 'iceCandidate':
				participants[parsedMessage.userId].rtcPeer.addIceCandidate(parsedMessage.candidate, function (error) {
					if (error) {
						console.error("Error adding candidate: " + error);
						return;
					}
				});
				break;
			case'chat message':
				receiveChatMessage(parsedMessage);

		}
	});
}


function enter() {
	socketInit();
	var roomName = roomId;
	name = document.getElementsByName('fullName')[0].value;

	var message = {
		id: 'joinRoom',
		name: name,
		roomName: roomName,
		audioOn:acceptAudio,
		videoOn:acceptVideo
	}


	sendMessage(message);
	toggleEnterLeaveButtons();

}

function checkUsersDevicesAndAccessPermissions(){
	const constraints = {
		'video': true,
		'audio': true
	}

	navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
			videoDeviceNumber= devices.filter(device => device.kind === 'videoinput').length;
			audioDeviceNumber= devices.filter(device => device.kind === 'audioinput').length;
			console.log("Number of video devices: "+ videoDeviceNumber);
			console.log("Number of audio devices: "+ audioDeviceNumber);
			// or not permited
			if (audioDeviceNumber>0){
				navigator.mediaDevices.getUserMedia({audio:true})
					.then(stream => {
						acceptAudio=true;
						audioBeforeEnterTheRoom=true;
						toggleMediaButtons('audio', true);
						console.log('Got MediaStream:', stream);
					})
					.catch(error => {
						acceptAudio=false;
						audioBeforeEnterTheRoom=false;
						toggleMediaButtons('audio', false);
						console.error('Error accessing media devices.', error);
					});
			}
			if (videoDeviceNumber>0){
				navigator.mediaDevices.getUserMedia({video:true})
					.then(stream => {
						acceptVideo=true;
						videoBeforeEnterTheRoom=true;
						toggleMediaButtons('video', true);
						console.log('Got MediaStream:', stream);
						document.getElementById('videoTest').srcObject=stream;
					})
					.catch(error => {
						acceptVideo=false;
						videoBeforeEnterTheRoom=false;
						toggleMediaButtons('video', false);
						console.error('Error accessing media devices.', error);
					});

			}
		})
		.catch(function(err) {
			console.error(err.name + ": " + err.message);
		});


}
function onNewParticipant(request) {
	receiveVideo(request);
}

function receiveVideoResponse(result) {
	participants[result.userId].rtcPeer.processAnswer(result.sdpAnswer, function (error) {
		if (error) return console.error(error);
	});
}

function callResponse(message) {
	if (message.response != 'accepted') {
		console.info('Call not accepted by peer. Closing call');
		stop();
	} else {
		webRtcPeer.processAnswer(message.sdpAnswer, function (error) {
			if (error) return console.error(error);
		});
	}
}

function onExistingParticipants(msg) {
	userId = msg.userId;
	var constraints = {
		audio: msg.audioOn,
		video: msg.videoOn

	};
	console.log(userId + " registered in room " + roomId);
	var participant = new Participant(name, userId, selfStream);
	participants[userId] = participant;

	var options = {
		localVideo: selfStream,
		mediaConstraints: constraints,
		onicecandidate: participant.onIceCandidate.bind(participant),

	}
	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
			if (error) {
				/*return*/ console.error(error);
			}
			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
			if (audioBeforeEnterTheRoom===false){
				removeMediaTrack('audio');
			}
			if (videoBeforeEnterTheRoom===false){
				removeMediaTrack('video');
			}
			document.getElementById('videoTest').style.display='none';
		});

	msg.data.forEach(receiveVideo);
}

function leaveRoom() {
	sendMessage({
		'id': 'leaveRoom'
	});

	for (var key in participants) {
		if (key !== userId) {
			participants[key].dispose();
		} else {
			participants[key].disposeSelf();
		}
		delete participants[key];
	}
	clearRemoteVideos();
	toggleEnterLeaveButtons();
	socket.close();
}

function receiveVideo(sender) {
	var participant = new Participant(sender.name, sender.userId);
	//kurento bug: in combination audio true and video false does not play audio in video DOM element
	if (sender.audioOn===true && sender.videoOn===false){
		participant.changeVideoElementToAudioElement();
	}
	participants[sender.userId] = participant;
	var video = participant.getVideoElement();


	var options = {
		remoteVideo: video,
		onicecandidate: participant.onIceCandidate.bind(participant)
	}

	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
		function (error) {
			if (error) {
				/*return*/ console.error(error);
			}
			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
		}
	);

}

function onParticipantLeft(request) {
	console.log('Participant ' + request.userId + ' left');
	var participant = participants[request.userId];
	participant.dispose();

	delete participants[request.userId];
}

function sendMessage(message) {
	console.log('Senging message: ' + message.id);
	if (socket){
		socket.emit('message', message);
	}
}

function sendMessageInChat() {
	var textarea = document.getElementById('message');
	let data={
		id:'chatMessage',
		message:textarea.value,
		roomId:roomId

	}
	sendMessage(data);
	textarea.value = '';
}