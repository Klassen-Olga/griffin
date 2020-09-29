function unmute() {
	console.log("Enabling audio")
	video.muted = false;
}
let peerConnection;
const config = {
	iceServers: [
		{
			urls: ["stun:stun.l.google.com:19302"]
		}
	]
};

const socket = io.connect(window.location.origin);

const video = document.querySelector("video");

socket.on("offer", (id, description) => {
	peerConnection = new RTCPeerConnection(config);
	peerConnection
		.setRemoteDescription(description)
		.then(() => peerConnection.createAnswer())
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(() => {
			socket.emit("answer", id, peerConnection.localDescription);
		});
	peerConnection.ontrack = event => {
		video.srcObject = event.streams[0];
	};
	peerConnection.onicecandidate = event => {
		console.log("kukuWat");
		console.log("kukuWat");

		if (event.candidate) {
			socket.emit("candidate", id, event.candidate);
		}
	};
});

socket.on("candidate", (id, candidate) => {
	peerConnection
		.addIceCandidate(new RTCIceCandidate(candidate))
		.catch(e => console.error(e));
	console.log(JSON.stringify(peerConnections));
	console.log(JSON.stringify(peerConnections[0]));
});

socket.on("connect", () => {
	socket.emit("watcher");
});

socket.on("broadcaster", () => {
	console.log("trololo");
	socket.emit("watcher");
});

socket.on("disconnectPeer", () => {
	peerConnection.close();
});

window.onunload = window.onbeforeunload = () => {
	socket.close();
};

