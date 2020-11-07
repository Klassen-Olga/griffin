/*
* This module manages video conference from peer connection(ManyToMany) side for not more than 3 users.
*
* */

window.onbeforeunload = () => {
	leaveRoom();
	if (socket) {
		socket.close();
	}
};


//all remote peer connections
const peerConnections = {};
//configuration for peer connection including stun and turn servers
const config = {
		iceServers: [

			{

				urls: ["stun:stun.l.google.com:19302"]

			},
			{
				urls: "turn:158.69.221.198",
				username: "klassen.olga@fh-erfurt.de",
				credential: '123'
			}
		]
	}
;

let socket = null;
//own window were users video and audio will be stored
const selfVideoElement = document.getElementsByName("selfStream")[0];


/*
* The function fires when user wants to enter to the video chat room
*
* here will be checked if the username is set
* and then newUser event will be sent to the server side.
* It will be also removed username input and enter button
* */

function requestForModerator() {
	var fullNameInput = document.getElementsByName('fullName')[0];
	let nameDiv = document.getElementById('nameDiv');
	let message = "Your name should be more then 1 symbol";

	if (validateStrLength(fullNameInput.value, 2, nameDiv, message) === false) {
		return;
	}

	socketInit();

	if (!socket) {
		console.error('Socket not defined');
		return;

	}

	socket.emit('requestForModeratorPeer', fullNameInput.value, roomId, dbId);
}

/*
* The function will be called if moderator allows new user to enter the room or for moderator self
* @param {*} role moderator or participant
* */
function enter(role) {
	var fullNameInput = document.getElementsByName('fullName')[0];

	disableNameInput();

	if (acceptVideo===false && acceptAudio===false){
		document.getElementsByName('selfStream')[0].style.display='none';
	}
	socket.emit("newUser", roomId, fullNameInput.value, role);
	toggleEnterLeaveButtons();


}

function enter2() {
	var fullNameInput = document.getElementsByName('fullName')[0];
	let nameDiv = document.getElementById('nameDiv');
	let message = "Your name should be more then 1 symbol";

	if (validateStrLength(fullNameInput.value, 2, nameDiv, message) === false) {
		return;
	}

	socketInit();
	if (!socket) {
		console.error('Socket not defined');
		return;

	}

	disableNameInput();

	if (acceptVideo===false && acceptAudio===false){
		document.getElementsByName('selfStream')[0].style.display='none';
	}
	socket.emit("newUser", roomId, fullNameInput.value);
	toggleEnterLeaveButtons();


}

function takePermissions() {
	document.getElementById('enterTheRoomStart').style.display='none';
	checkUsersDevicesAndAccessPermissions(selfVideoElement, 'peer');

}

/*
*
* The function initializes all socket event listeners for peer connection(ManyToMany)
* including chat message event and request to join room for moderator
*
* */
function socketInit() {

	if (!socket) {
		socket = io.connect();
	}
	/*
	* remote user gets info about new user entered the room and sends him his full name
	* */
	socket.on("newUser", (newUserId) => {
		let fullName = document.getElementById('fullName').innerText;
		socket.emit("requestForOffer", newUserId, fullName);
	});

	/*
	* new user creates a peer connection and sends an offer to remote user
	* */
	socket.on("requestForOffer", (oldUserId, fullName) => {
		//create peer connection
		const peerConnection = createPeerConnection(oldUserId, fullName);

		peerConnections[oldUserId] = peerConnection;


		//if  any iceCandidate appears, emit candidate event
		peerConnection.onicecandidate = event => {
			if (event.candidate) {
				console.log("event-candiate-client: " + event.candidate)
				socket.emit("candidate", oldUserId, event.candidate);
			}
		};
		//create session description and send it to watcher
		peerConnection
			.createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true})
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(() => {
				let myFullName = document.getElementById('fullName').innerText;
				socket.emit("offer", oldUserId, peerConnection.localDescription, myFullName, videoBeforeEnterTheRoom);
			});
	});


	/*
	* remote user creates his peer connection and sends answer to new user
	* */
	socket.on("offer", (newUserId, description, fullName, videoOn) => {
		const peerConnection = createPeerConnection(newUserId, fullName);

		peerConnections[newUserId] = peerConnection;
		peerConnection
			.setRemoteDescription(description)
			.then(() => peerConnection.createAnswer())
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(() => {
				socket.emit("answer", newUserId, peerConnection.localDescription, videoBeforeEnterTheRoom);
			});

		peerConnection.onicecandidate = event => {
			if (event.candidate) {
				socket.emit("candidate", newUserId, event.candidate);
			}
		};
		if (document.getElementById(newUserId) === null) {
			let div = appendNewVideoWindow(fullName);
			div.setAttribute('id', newUserId);
			if (videoOn === false) {
				div.setAttribute('videoEnabled', false);
			}
		}
		//insert old user to the chat select element
		insertOptionToSelect(newUserId, fullName);
	});


	/*
	*
	* new user gets the answer from the remote user and sets
	 * the session description of remote user into his peer connection
	* */
	socket.on("answer", (oldUserId, description, fullName, remoteVideoBeforeEnterTheRoom) => {
		peerConnections[oldUserId].setRemoteDescription(description);
		// before on track is called create div,
		// which represents new user for case if this user has no audio and video
		if (document.getElementById(oldUserId) === null) {
			let div = appendNewVideoWindow(fullName);
			div.setAttribute('id', oldUserId);
			// mark, that remote user has his video disabled
			// for case on track will be called and user has granted permissions to the camera
			if (remoteVideoBeforeEnterTheRoom === false) {
				div.setAttribute('videoEnabled', false);
			}
		}
		//insert old user to the chat select element
		insertOptionToSelect(oldUserId, fullName);
	});

	/*
	*
	* both users: new and remote should save all their ice candidates into the peer connection
	* */
	socket.on("candidate", (id, candidate) => {

		peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));

		console.log(JSON.stringify(peerConnections));

	});

	/*
	*
	* when user closes tab or presses leave button peer connection will be closed
	* and all connected users will remove the user from the video chat
	* */
	socket.on("disconnectPeer", id => {
		peerConnections[id].iceConnectionState = 'disconnected';
		peerConnections[id].close();
		let foreignUserContainer = document.getElementById(id);
		let div = document.getElementById('foreignVideoContainer');

		if (foreignUserContainer === null) {
			return;
		}
		//removeOptionFromSelect(id);
		if (foreignUserContainer.tagName === 'VIDEO') {
			div.removeChild(foreignUserContainer.parentNode);
		}
		//case when there is no video and audio available
		else if (foreignUserContainer.tagName === 'DIV') {
			div.removeChild(foreignUserContainer);
		}

	});

	socket.on('chat message', data => receiveChatMessage(data));
	// event fired when moderator enters the room or if the moderator is not available
	socket.on('onEnterNotification', err => {
		if (err === null) {
			enter('moderator');
		} else {
			alert(err);
		}

	});

	socket.on('waitModeratorResponse', () => {
		alert('Please wait until moderator accepts your entry');
	});
	// event for new user to receive a response of moderator
	socket.on('requestForModerator', (userId, fullName) => {

		if (confirm('New user ' + fullName + ' want to join the conference room.' +
			'\n Are you agree?')) {
			socket.emit('moderatorResponsePeer', true, userId)
		} else {
			socket.emit('moderatorResponsePeer', false, userId)
		}
	});
	socket.on('moderatorResponsePeer', (accepted) => {
		moderatorResponse(accepted);
	})
	socket.on('videoDisabled', userId => {
		let video = document.getElementById(userId);
		if (!video) {
			return;
		}
		putNameOverVideo(video);

	});
	socket.on('videoEnabled', userId => {
		console.log('USER ' + userId + ' disables his video');
		let video = document.getElementById(userId);
		if (!video) {
			return;
		}
		putVideoOverName(video);

	});
	/*
	* error while database transactions or maximum number of users is reached
	* */
	socket.on('participantsNumberError', message=>{
		alert(message);
	});
	socket.on('databaseError', message=>{
		alert(message);
	});

}

/*
* The function appends a div element around the video element ans fullName span
* or if no video and no audio available remains as container for user presence
*
* */
function appendNewVideoWindow(fullName, video) {
	let div = document.createElement('div');
	div.classList.add('videoDiv');
	let span = document.createElement('span');
	span.appendChild(document.createTextNode(fullName));
	if (video) {
		div.appendChild(video);
	}
	div.appendChild(span);
	document.getElementById('foreignVideoContainer').appendChild(div);
	if (!video) {
		div.style.display = 'flex';
		div.style.justifyContent = 'center';
		div.style.alignItems = 'center';
		span.style.fontSize = 'x-large';
	}


	return div;
}


function createPeerConnection(id, fullName) {

	const peerConnection = new RTCPeerConnection(config);
	peerConnection.id = id;
	let stream = selfVideoElement.srcObject;

	if (stream !== null) {
		stream.getTracks().forEach(track => {
			peerConnection.addTrack(track, stream);
		})
	}


	peerConnection.onnegotiationneeded = function () {
		console.log('NEGOTIATION NEEDED');
	}
	peerConnection.ontrack = (event) => {
		let videoOn = true;
		console.log('On track event for user with id ' + id + ' ' + ' number of tracks ' + JSON.stringify(event.streams[0].getTracks().length));
		videoOn = removeDivAndGetVideoFlag(id, videoOn);
		let video = document.getElementById(id);

		//because on track will be fired twice: for video and for audio
		if (video === null) {
			let video = document.createElement("video");
			video.setAttribute("autoplay", true);
			video.setAttribute("playsinline", true);
			video.setAttribute("controls", false);
			video.setAttribute("fullName", fullName);

			appendNewVideoWindow(fullName, video);
			video.setAttribute('id', id);
			video.srcObject = event.streams[0];
			if (videoOn === false) {
				putNameOverVideo(video);
			}

		} else {
			video.srcObject = null;
			video.srcObject = event.streams[0];
		}

	};

	return peerConnection;
}

function removeDivAndGetVideoFlag(id, videoOn) {
	//case if div for no video already appended
	if (document.getElementById(id) !== null && document.getElementById(id).tagName === 'DIV') {
		if (document.getElementById(id).getAttribute('videoEnabled') !== null) {
			videoOn = false;
		}
		document.getElementById(id).remove();
	}
	return videoOn;
}


function leaveRoom() {
	for (var key in peerConnections) {
		peerConnections[key].close();
		delete peerConnections[key];
	}


	enableNameInputAndRemoveSelfName();
	selfVideoElement.srcObject = null;
	clearRemoteVideos();
	clearAllSelectOptions();
	if (socket) {
		socket.emit('disconnect');
		socket.close();
		socket = null;
		toggleEnterLeaveButtons();
		buttonsOnLoadThePage();
	}

}

/*
* on click function used to attach new message to the cht area
* */
function sendMessageInChat() {
	var textarea = document.getElementById('message');
	let name = document.getElementById('fullName').innerText;
	let participantTo = document.getElementById('participants').value;
	socket.emit('chat message', textarea.value, roomId, name, participantTo);
	textarea.value = '';
}

/*
* Function used to inform all users in the room, that current user disabled the camera
* after user enters the room
* */
function informUsersVideoOff() {
	if (socket) {
		socket.emit('videoDisabled', roomId);
	}
}

/*
* Function used to inform all users in the room, that current user enabled the camera
* after user enters the room
* */
function informUsersVideoOn() {
	if (socket) {
		socket.emit('videoEnabled', roomId);
	}
}