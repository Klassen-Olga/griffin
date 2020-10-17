var commonScripts=[
	"/socket.io/socket.io.js",
	"/script/helper.js"
]
var kurentoScripts=[
	"/bower_components/webrtc-adapter/release/adapter.js",
	'/bower_components/kurento-utils/js/kurento-utils.js',
	"/script/helperKurentoGroupCall.js",
	"/script/participants.js",
	"/script/kurentoGroupCall.js"
]
var peerScripts=[
	"/script/helperPeerConnection.js",
	"/script/peerConnectionHandler.js"
]

var body = document.getElementsByTagName('body')[0];

function appendNewSrc(paths) {
	for (let i=0; i<paths.length; i++){
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src=paths[i];
		body.appendChild(script);
	}
}

appendNewSrc(commonScripts);
if (typeof participantsNumber !== 'undefined' && participantsNumber > 3) {
	appendNewSrc(kurentoScripts);

} else {
	appendNewSrc(peerScripts);
}

