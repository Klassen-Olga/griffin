const PARTICIPANT_MAIN_CLASS = 'participant main';
const PARTICIPANT_CLASS = 'participant';

/**
 * Creates a video element for a new participant
 *
 * @param {String} name - the name of the new participant, to be used as tag
 *                        name of the video element.
 *                        The tag of the new element will be 'video<name>'
 * @return
 */
function Participant(name, userId, selfStream) {
	var container = document.getElementById('foreignVideoContainer');
	if (typeof selfStream !== 'undefined'){
		this.name = name;
		this.userId=userId;
		var video=selfStream;
		video.id=userId;
	}
	else{
		this.name = name;
		this.userId=userId;
		var span = document.createElement('span');
		var video = document.createElement('video');
		var rtcPeer;

		video.controls=false;
		container.appendChild(video);
		container.appendChild(span);

		span.appendChild(document.createTextNode(name));

		video.id = userId;
		video.autoplay = true;
		video.controls = false;
	}



	this.getElement = function() {
		return container;
	}

	this.getVideoElement = function() {
		return video;
	}



	function isPresentMainParticipant() {
		return ((document.getElementsByClassName(PARTICIPANT_MAIN_CLASS)).length != 0);
	}

	this.offerToReceiveVideo = function(error, offerSdp, wp){
		if (error) return console.error ("sdp offer error")
		console.log('Invoking SDP offer callback function');
		var msg =  {
				id : "receiveVideoFrom",
				sender : this.userId,
				sdpOffer : offerSdp
		};
		sendMessage(msg);
	}


	this.onIceCandidate = function (candidate, wp) {
		  console.log("Local candidate" + candidate);

		  var message = {
		    id: 'onIceCandidate',
		    candidate: candidate,
		    sender: this.userId
		  };
		  sendMessage(message);
	}

	Object.defineProperty(this, 'rtcPeer', { writable: true});

	this.dispose = function() {
		console.log('Disposing participant ' + this.name);
		this.rtcPeer.dispose();

		container.removeChild(video);
		if (span){
			container.removeChild(span);
		}
	};
	this.disposeSelf=function () {
		console.log('Disposing self ' + this.name);
		this.rtcPeer.dispose();

	}
}