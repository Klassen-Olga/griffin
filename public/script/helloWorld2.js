var roomName;
var userName;
//list of call partivipans
var participants = {};

// Let's do this
var socket = io();

btnRegister.onclick = function () {
	roomName = inputRoom.value;
	userName = inputName.value;


	console.log('sending ' + message.event + ' message to server');
	socket.emit('newUser', userName);


}
//for new user === existingPaticipants
socket.on('newUser', (existingUsersArray, newUserId) => {


	var video = document.createElement('video');
	video.id = newUserId;
	video.autoplay = true;
	var div = document.createElement('div');
	div.className = "videoContainer";
	var name = document.createElement('div');

	name.appendChild(document.createTextNode(userName));
	div.appendChild(video);
	div.appendChild(name);
	divMeetingRoom.appendChild(div);

	var user = {
		id: newUserId,
		username: userName,
		video: video,
		rtcPeer: null
	}

	participants[user.id] = user;

	var constraints = {
		audio: true,
		video : {
			mandatory : {
				maxWidth : 320,
				maxFrameRate : 15,
				minFrameRate : 15
			}
		}
	};

	var options = {
		localVideo: video,
		mediaConstraints: constraints,
		onicecandidate: function (candidate) {
		socket.emit('candidate',newUserId,'1', candidate);
	}
	}

	user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (err) {
			if (err) {
				return console.error(err);
			}
			this.generateOffer((err, offer)=>{
				socket.emit('offer', newUserId, '1', sdpOffer);
			});
		}
	);

	//create video element for each user in the room and make them offer
	existingUsersArray.forEach(function (element) {
		// calling the receiveVideo function,
		// which does the same process but this time for each one of the other participants on the call
		receiveVideo(element.id, element.name);
	});

});
function receiveVideo(oldUserId, userName){
	//create the video element for showing the stream
	var video = document.createElement('video');
	var div = document.createElement('div');
	div.className = "videoContainer";
	var name = document.createElement('div');
	video.id = oldUserId;
	video.autoplay = true;
	name.appendChild(document.createTextNode(username));
	div.appendChild(video);
	div.appendChild(name);
	divMeetingRoom.appendChild(div);

	//create an user for the current participant.
	var user = {
		id: oldUserId,
		username: userName,
		video: video,
		rtcPeer: null
	}

	// store the user object on the global participant array
	participants[oldUserId] = user;

	var options = {
		remoteVideo: video,
		onicecandidate: function (candidate) {
			socket.emit('candidate',oldUserId,'1', candidate);
		}
	}

	// create the Kurento’s implementation of the RTCPeerConnection API object
	// and assign it to the rtcPeer field
	user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
		function (err) {
			if (err) {
				return console.error(err);
			}
			//  prepare an offer to begin with the signaling process
			this.generateOffer((err, offer)=>{
				socket.emit('offer', '1', oldUserId, offer);
			});
		}
	);
}
//for another old users in the room
socket.on('newParticipantArrived', (newUserId, userName) => {

	receiveVideo(newUserId, userName)
});