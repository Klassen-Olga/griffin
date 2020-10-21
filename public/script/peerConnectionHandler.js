/*
* This module manages video conference from peer connection(ManyToMany) side for not more than 3 users.
*
* */
window.onload = () => {
	document.getElementById('enterTheRoom').style.display = 'block';
	document.getElementById('leaveTheRoom').style.display = 'none';
	videoTest.style.display = 'none';
	checkUsersDevicesAndAccessPermissions(selfVideoElement);

}

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
		}
	]
};

let socket = null;
//own window were users video and audio will be stored
const selfVideoElement = document.getElementsByName("selfStream")[0];
const videoTest = document.getElementById('videoTest');


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

	socket.emit('requestForModeratorPeer', fullNameInput.value, roomId);
}
/*
* The function will be called if moderator allows new user to enter the room or for moderator self
* */
function enter() {
	var fullNameInput = document.getElementsByName('fullName')[0];

	if (videoTest.srcObject !== null) {
		selfVideoElement.srcObject = videoTest.srcObject;
	}

	disableNameInputAndPrintSelfName();

	socket.emit("newUser", roomId, fullNameInput.value);
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
	if (videoTest.srcObject !== null) {
		selfVideoElement.srcObject = videoTest.srcObject;
	}

	disableNameInputAndPrintSelfName();

	socket.emit("newUser", roomId, fullNameInput.value);
	toggleEnterLeaveButtons();


}
/*
*
* The function initializes all socket event listeners for peer connection(ManyToMany)
* including chat message event and request to join room for moderator
*
* */
function socketInit() {

	socket = io.connect();
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
				socket.emit("offer", oldUserId, peerConnection.localDescription, myFullName);
			});
	});


	/*
	* remote user creates his peer connection and sends answer to new user
	* */
	socket.on("offer", (newUserId, description, fullName) => {
		const peerConnection = createPeerConnection(newUserId, fullName);

		peerConnections[newUserId] = peerConnection;
		peerConnection
			.setRemoteDescription(description)
			.then(() => peerConnection.createAnswer())
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(() => {
				socket.emit("answer", newUserId, peerConnection.localDescription);
			});

		peerConnection.onicecandidate = event => {
			if (event.candidate) {
				socket.emit("candidate", newUserId, event.candidate);
			}
		};
		if (document.getElementById(newUserId) === null) {
			appendNewVideoWindow(fullName).setAttribute('id', newUserId);
		}
	});


	/*
	*
	* new user gets the answer from the remote user and sets
	 * the session description of remote user into his peer connection
	* */
	socket.on("answer", (oldUserId, description, fullName) => {
		peerConnections[oldUserId].setRemoteDescription(description);
		if (document.getElementById(oldUserId) === null) {
			appendNewVideoWindow(fullName).setAttribute('id', oldUserId);
		}
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
			enter();
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
	div.appendChild(span);
	if (video) {
		div.appendChild(video);
	}
	document.getElementById('foreignVideoContainer').appendChild(div);
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
		console.log('On track event for user with id ' + id + ' ' + ' number of tracks ' + JSON.stringify(event.streams[0].getTracks().length));
		//case if div for no video already appended
		if (document.getElementById(id) !== null && document.getElementById(id).tagName === 'DIV') {
			document.getElementById(id).remove();
		}
		let video = document.getElementById(id);

		//because on track will be fired twice: for video and for audio
		if (document.getElementById(id) === null) {
			let video = document.createElement("video");
			video.setAttribute("autoplay", true);
			video.setAttribute("playsinline", true);
			video.setAttribute("controls", false);
			video.setAttribute("fullName", fullName);

			appendNewVideoWindow(fullName, video);
			video.setAttribute('id', id);
			video.srcObject = event.streams[0];

		} else {
			video.srcObject = null;
			video.srcObject = event.streams[0];
		}

	};

	return peerConnection;
}


function leaveRoom() {
	for (var key in peerConnections) {
		peerConnections[key].close();
		delete peerConnections[key];
	}


	enableNameInputAndRemoveSelfName();
	selfVideoElement.srcObject = null;
	clearRemoteVideos();
	socket.emit('disconnect');
	socket.close();
	toggleEnterLeaveButtons();
	checkUsersDevicesAndAccessPermissions(videoTest);
}
/*
* on click function used to attach new message to the cht area
* */
function sendMessageInChat() {
	var textarea = document.getElementById('message');
	let name = document.getElementById('fullName').innerText;
	socket.emit('chat message', textarea.value, roomId, document.getElementById('fullName').innerText);
	textarea.value = '';
}


