/*
* This module manages video conference from Kurento Media Server (KMS) side for more than 3 users.
*
* */
window.onbeforeunload = () => {
	socket.close();
};


/*
* variables for managing peer connections and users personal data
* */
var socket = null;
var participants = {};
var name = null;
var userId = null;
var selfStream = document.getElementsByName('selfStream')[0];

/*
*
* The function initializes all socket event listeners for kurento connection
* including chat message event and request to join room for moderator
*
* */
function socketInit() {
	socket = io();

	socket.on('message', parsedMessage => {
		console.info('Received message: ' + parsedMessage.id);

		switch (parsedMessage.id) {
			//event for self user, when he leaves the room
			case 'disconn':
				participants[userId].disposeSelf();
				socket.close();
				break;
			// event for new user to connect to KMS and register other users in room
			case 'existingParticipants':
				onExistingParticipants(parsedMessage);
				break;
			// event for other users to register new participant
			case 'newParticipantArrived':
				onNewParticipant(parsedMessage);
				break;
			// event for other users to register the leaving of user
			case 'participantLeft':
				onParticipantLeft(parsedMessage);
				break;
			// event to register answers : user-KMS and user-user
			case 'receiveVideoAnswer':
				receiveVideoResponse(parsedMessage);
				break;
			// event for exchanging ICE candidates between WebRTC peers
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
				break;

			// event for new user to receive a response of moderator
			case 'moderatorResponse':
				moderatorResponse(parsedMessage.accepted, socket);
				break;
			case 'videoDisabled':
				putNameOverVideo(document.getElementById(parsedMessage.userId));
				break;
			case 'videoEnabled':
				putVideoOverName(document.getElementById(parsedMessage.userId));
				break;

		}
	});
	// event fired when moderator enters the room or if the moderator is not available
	socket.on('onEnterNotification', error => {
		if (error === null) {
			enter('moderator');
		} else {
			alert(error);
		}
	});
	//  event for requesting permission from the moderator to log in a new user
	socket.on('requestForModerator', (socketId, fullName) => {
		let data = {
			id: 'moderatorResponse',
			userId: socketId,
			accepted: false
		}

		addModal(fullName, (modalId) => {
			data.accepted = true;
			document.getElementById(modalId).remove();
			sendMessage(data);
		}, (modalId) => {
			document.getElementById(modalId).remove();
			sendMessage(data);
		});

	});
	socket.on('waitModeratorResponse', () => {
		alert('Please wait until moderator accepts your entry');
	});
}

/*
* The function will be called if the user presses 'Enter the room' button
* request to join the room will be sent to the moderator of current room
*
* */
function requestForModerator() {
	name = document.getElementsByName('fullName')[0].value;
	let err = "Your name should be more then 1 symbol";
	if (validateStrLength(name, 2, document.getElementById('nameDiv'), err) === false) {
		return;
	}

	socketInit();

	if (!socket) {
		console.error('Socket not defined');
		return;

	}
	var message = {
		id: 'requestForModerator',
		name: document.getElementsByName('fullName')[0].value,
		roomName: roomId,
		dbId: dbId
	}

	sendMessage(message);
}

function takePermissions() {

	checkUsersDevicesAndAccessPermissions(selfStream, 'kurento');

}

function enter2() {

	name = document.getElementsByName('fullName')[0].value;
	let err = "Your name should be more then 1 symbol";
	if (validateStrLength(name, 2, document.getElementById('nameDiv'), err) === false) {
		return;
	}

	socketInit();

	if (!socket) {
		console.error('Socket not defined');
		return;

	}

	disableNameInput();
	if (acceptVideo === false && acceptAudio === false) {
		document.getElementsByName('selfStream')[0].style.display = 'none';
	}
	var message = {
		id: 'joinRoom',
		name: name,
		roomName: roomId,
		audioOn: acceptAudio,
		videoOn: acceptVideo,
		videoBeforeEnterTheRoom: videoBeforeEnterTheRoom
	}


	sendMessage(message);
	toggleEnterLeaveButtons();

}

/*
* The function will be called if moderator allows new user to enter the room or for moderator self
* */
function enter(role) {

	disableNameInput();
	var message = {
		id: 'joinRoom',
		name: name,
		roomName: roomId,
		role: role,
		// Flags for use cases, where user did not give the permissions to his media devices.
		// Constraints to the connection to KMS should be in the same way e.g. audio:true; video:false.
		audioOn: acceptAudio,
		videoOn: acceptVideo,
		videoBeforeEnterTheRoom: videoBeforeEnterTheRoom
	}
	sendMessage(message);
	toggleEnterLeaveButtons();

}


function onNewParticipant(request) {
	receiveVideo(request);
}

function receiveVideoResponse(result) {
	console.log('Proceed answer');
	participants[result.userId].rtcPeer.processAnswer(result.sdpAnswer, function (error) {
		if (error) return console.error(error);
	});
}

/*
* Function will be called to connect a new user to KMS and to register all users present in conference room
*
* A connection to KMS will be created in send mode with constrains
* depending on what permissions the user has granted and what multimedia devices the user has
* */
function onExistingParticipants(msg) {
	userId = msg.userId;
	var iceServers = [
		{
			url: 'turn:' + turnUrl,
			username: turnUsername,
			credential: turnCredential
		}
	];
	let videoConstraints = null;
	if (msg.videoOn === true) {
		if (reduceFramerateKurento==="true"){
			videoConstraints = {
				frameRate: {
					min: 2, ideal: 15, max: 30
				},
				width: {
					min: 50, ideal: 250, max: 640
				},
				height: {
					min: 32, ideal: 250, max: 640
				}
			}
		}

	} else {
		videoConstraints = false;
	}

	var constraints = {


		audio: msg.audioOn,
		video: videoConstraints,
		configurations: {
			iceServers: iceServers
		}

	};
	console.log(userId + " registered in room " + roomId);
	var participant = new Participant(name, userId, selfStream);
	participants[userId] = participant;

	var options = {
		localVideo: selfStream,
		mediaConstraints: constraints,
		onicecandidate: participant.onIceCandidate.bind(participant),


	}
	//user connects to KMS
	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
			if (error) {
				/*return*/
				console.error(error);
			}
			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
			//if user decided to turn his media devices off before the call has started
			if (audioBeforeEnterTheRoom === false) {
				removeMediaTrack('audio');
			}
			if (videoBeforeEnterTheRoom === false) {
				removeMediaTrack('video');
			}
		});

	//user registers other users in this chat room
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
	clearAllSelectOptions();
	enableNameInputAndRemoveSelfName();
	toggleEnterLeaveButtons();

	buttonsOnLoadThePage();
	socket.close();
}

/*
* 1. The function will be called on the side of the new user
*    to register all users already in the conference room
* 2. Or the function will be called on the old user side to register a new user
*
* To register the user:
*                       1. A video DOM element or audio DOM element with id of his socket.id will be created
*                          Video element, if user has or gave permissions to a) video and audio
*                                                                            b) video only
*
*                          Audio DOM element, if has or gave permissions to  a) audio only
*                          (In kurento-utils some flags are set to not provide this option in video element,
*                           with audio there are no such problems)
*                       2. A connection to KMS in receive mode only will be created
*                       3. An offer to KMS will be sent
* */
function receiveVideo(sender) {
	var participant = new Participant(sender.name, sender.userId);
	//kurento bug: in combination audio true and video false does not play audio in video DOM element
	if (sender.audioOn === true && sender.videoOn === false) {
		participant.changeVideoElementToAudioElement();
	}
	participants[sender.userId] = participant;
	var video = participant.getVideoElement();

	insertOptionToSelect(sender.userId, sender.name)
	var options = {
		remoteVideo: video,
		onicecandidate: participant.onIceCandidate.bind(participant)
	}

	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
		function (error) {
			if (error) {
				/*return*/
				console.error(error);
			}
			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
			if (sender.videoBeforeEnterTheRoom === false) {
				putNameOverVideo(participant.getVideoElement());
			}
		}
	);

}

function onParticipantLeft(request) {
	console.log('Participant ' + request.userId + ' left');
	var participant = participants[request.userId];
	participant.dispose();
	removeOptionFromSelect(request.userId);
	delete participants[request.userId];
}

function sendMessage(message) {
	console.log('Senging message: ' + message.id);
	if (socket) {
		socket.emit('message', message);
	}
}

function sendMessageInChat() {
	var textarea = document.getElementById('message');
	let participantTo = document.getElementById('participants').value;
	let data = {
		id: 'chatMessage',
		message: textarea.value,
		roomId: roomId,
		toId: participantTo

	}
	sendMessage(data);
	textarea.value = '';
}
