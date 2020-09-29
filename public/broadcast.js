const peerConnections = {};
const config = {
	iceServers: [
		{
			urls: ["stun:stun.l.google.com:19302"]
		}
	]
};
// Media contrains
const constraints = {
	video: { facingMode: "user" },
	audio: true,
};
const socket = io.connect(window.location.origin);
const video = document.getElementById("selfStream");
function stream() {
	console.log(JSON.stringify(navigator.mediaDevices));
	//take stream of my video, show it on my screen, emit broadcaster
	navigator.mediaDevices.getUserMedia(constraints)
		.then(stream => {
			video.srcObject = stream;
			socket.emit("broadcaster");
		})
		.catch(error => console.error(error));
}

//if watcher is emitted
socket.on("watcher", id => {
	//create peer connection
	const peerConnection = new RTCPeerConnection(config);
	peerConnections[id] = peerConnection;

	//take stream of my video
	let stream = video.srcObject;
	//Then we add the local stream to the connection
	//point where we connect the stream we receive from getUserMedia() to the RTCPeerConnection.
	// A media stream consi	sts of at least one media track,
	// and these are individually added to the RTCPeerConnection
	// when we want to transmit the media to the remote peer.
	stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

	//if there is any iceCandidate appears, emit candidate event
	peerConnection.onicecandidate = event => {
		if (event.candidate) {
			console.log("kukuBr");
			console.log("kukuBr");
			socket.emit("candidate", id, event.candidate);
			console.log(JSON.stringify(peerConnections));
			console.log(JSON.stringify(peerConnections[0]));
		}
	};

	//create session description and send it to watcher
	peerConnection
		.createOffer()
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(() => {
			socket.emit("offer", id, peerConnection.localDescription);
		});
});

socket.on("answer", (id, description) => {
	peerConnections[id].setRemoteDescription(description);
});

socket.on("candidate", (id, candidate) => {
	peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});
socket.on("disconnectPeer", id => {
	peerConnections[id].close();
	delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
	socket.close();
}