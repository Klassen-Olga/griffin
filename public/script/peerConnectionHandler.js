window.onload = () => {
	document.getElementById('enterTheRoom').style.display = 'block';
	document.getElementById('leaveTheRoom').style.display = 'none';
	document.getElementById('videoTest').style.display='none';
}


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
//connection to the socket (link to the repo in room.ejs)
let socket = null;
//own window were users video and audio will be saved
const selfVideoElement = document.getElementsByName("selfStream")[0];


//to enter to the video chat room user needs minimum an audio device available
/*
navigator.mediaDevices.getUserMedia({audio: true})
	.then(stream => {
		selfVideoElement.srcObject = stream;
		document.getElementById('audioOn').disabled = true;

	})
	.catch(error => {

		handleError(error);
		console.error("EE: " + error);
	});
*/
/*
* variables for managing device access
* */
var audioDeviceNumber = 0;
var videoDeviceNumber = 0;
var acceptAudio = false;
var acceptVideo = false;
var audioBeforeEnterTheRoom = false;
var videoBeforeEnterTheRoom = false;
checkUsersDevicesAndAccessPermissions();

function checkUsersDevicesAndAccessPermissions() {

	navigator.mediaDevices.enumerateDevices()
		.then(function (devices) {
			videoDeviceNumber = devices.filter(device => device.kind === 'videoinput').length;
			audioDeviceNumber = devices.filter(device => device.kind === 'audioinput').length;
			console.log("Number of video devices: " + videoDeviceNumber);
			console.log("Number of audio devices: " + audioDeviceNumber);
			// or not permited
			if (audioDeviceNumber > 0) {
				navigator.mediaDevices.getUserMedia({audio: true})
					.then(stream => {
						acceptAudio = true;
						audioBeforeEnterTheRoom = true;
						toggleMediaButtons('audio', true);
						console.log('Got MediaStream:', stream);
						addTrackToSrcObject('audio', stream);
					})
					.catch(error => {
						acceptAudio = false;
						audioBeforeEnterTheRoom = false;
						toggleMediaButtons('audio', false);
						console.error('Error accessing media devices.', error);
					});
			}
			if (videoDeviceNumber > 0) {
				navigator.mediaDevices.getUserMedia({video: true})
					.then(stream => {
						acceptVideo = true;
						videoBeforeEnterTheRoom = true;
						toggleMediaButtons('video', true);
						console.log('Got MediaStream:', stream);
						addTrackToSrcObject('video', stream);

					})
					.catch(error => {
						acceptVideo = false;
						videoBeforeEnterTheRoom = false;
						toggleMediaButtons('video', false);
						console.error('Error accessing media devices.', error);
					});

			}
		})
		.catch(function (err) {
			console.error(err.name + ": " + err.message);
		});


}


/*
* fires when user wants to enter to the video chat room
*
* here will be checked if the username is set
* and then newUser event will be sent to the server side.
* It will be also removed username input and enter button
* */
//TODO: when left  the room remove name and make input name available
//TODO: when reenter navigator.getusermedia should be called
function enter() {
	socket = io.connect(window.location.origin);

	if (!socket){
		console.error('Socket not defined');
		return;
	}
	initEvents();
	var fullNameInput = document.getElementsByName('fullName')[0];
	let nameDiv = document.getElementById('nameDiv');

	if (fullNameInput.value.length < 2) {
		if (nameDiv.lastChild.tagName !== 'P') {
			let p = document.createElement('p');
			p.innerText = "Your name should be more then 1 symbol";
			nameDiv.appendChild(p);
		}
		return;

	}
	document.getElementById('fullName').innerText = fullNameInput.value;
	nameDiv.style.display = 'none';

	socket.emit("newUser", roomId, fullNameInput.value);
	toggleEnterLeaveButtons();

}

function initEvents() {

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
		if (document.getElementById(newUserId)===null){
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
		if (document.getElementById(oldUserId)===null){
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
	* when user closes tab peer connection will be closed
	* and all connected users will remove this user from the video chat
	* */
	socket.on("disconnectPeer", id => {
		peerConnections[id].iceConnectionState == 'disconnected';
		peerConnections[id].close();
		let video = document.getElementById(id);
		let div = document.getElementById('foreignVideoContainer');
		div.removeChild(video);
	});

	/*
	*remote user will save session description of user, who added media tracks
	*and will response with an answer
	* */
	socket.on("mediaOnAnswer", (userWhichAddedAudioTrack, description) => {
		peerConnections[userWhichAddedAudioTrack]
			.setRemoteDescription(description)
			.then(() => peerConnections[userWhichAddedAudioTrack].createAnswer())
			.then(sdp => peerConnections[userWhichAddedAudioTrack].setLocalDescription(sdp))
			.then(() => {
				socket.emit("answer", userWhichAddedAudioTrack, peerConnections[userWhichAddedAudioTrack].localDescription);
			});

	});
	socket.on('chat message', data => receiveChatMessage(data));

}

/*/!*
* if a user wants to add his audio or video after the connection was established,
* function will iterate over all users remote connections and will make offer to each of them
* *!/

async function updateTracksOnRemotePeers(tracks) {
	for (let key in peerConnections) {
		if (peerConnections.hasOwnProperty(key)) {
			peerConnections[key].addTrack(tracks[0], selfVideoElement.srcObject);
			let sdp = await peerConnections[key].createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true});
			await peerConnections[key].setLocalDescription(sdp);
			await socket.emit("mediaOnOffer", peerConnections[key].localDescription, key);
		}
	}
}*/

function appendNewVideoWindow(fullName, video) {
	let div = document.createElement('div');
	div.classList.add('videoDiv');
	let span=document.createElement('span');
	span.appendChild(document.createTextNode(fullName));
	div.appendChild(span);
	if (video){
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
		if (document.getElementById(id)!==null && document.getElementById(id).tagName==='DIV'){
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

window.onunload = window.onbeforeunload = () => {

	socket.close();
};

function leaveRoom() {
	for (var key in peerConnections) {
		peerConnections[key].close();
		delete peerConnections[key];
	}

	selfVideoElement.srcObject = null;
	clearRemoteVideos();
	socket.close();
	toggleEnterLeaveButtons();

}

function sendMessageInChat() {
	var textarea = document.getElementById('message');
	let name = document.getElementById('fullName').innerText;
	socket.emit('chat message', textarea.value, roomId, document.getElementById('fullName').innerText);
	textarea.value = '';
}



