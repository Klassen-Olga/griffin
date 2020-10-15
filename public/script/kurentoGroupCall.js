var socket = null;
var participants = {};
var name = null;
var userId = null;
var selfStream = document.getElementsByName('selfStream')[0];
/*window.onbeforeunload = function() {
	socket.disconnect();
};*/
window.onbeforeunload = () => {
	socket.close();
};
window.onload=()=>{
	document.getElementById('enterTheRoom').style.display='block';
	document.getElementById('leaveTheRoom').style.display='none';
}

function enter() {

	socketInit();
	name = document.getElementsByName('fullName')[0].value;
	var roomName = roomId;

	var message = {
		id: 'joinRoom',
		name: name,
		roomName: roomName,
	}
	sendMessage(message);
	toggleEnterLeaveButtons();

}
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
		audio: true,
		video: {
			mandatory: {
				maxWidth: 320,
				maxFrameRate: 15,
				minFrameRate: 15
			}
		}
	};
	console.log(userId + " registered in room " + roomId);
	var participant = new Participant(name, userId, selfStream);
	participants[userId] = participant;

	var options = {
		localVideo: selfStream,
		mediaConstraints: constraints,
		onicecandidate: participant.onIceCandidate.bind(participant)
	}
	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
			if (error) {
				return console.error(error);
			}
			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
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
	participants[sender.userId] = participant;
	var video = participant.getVideoElement();


	var options = {
		remoteVideo: video,
		onicecandidate: participant.onIceCandidate.bind(participant)
	}

	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
		function (error) {
			if (error) {
				return console.error(error);
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
	socket.emit('message', message);
}

function sendMessageInChat() {
	var textarea = document.getElementById('message');
	socket.emit('chat message', textarea.value, roomId);
	textarea.value = '';
}