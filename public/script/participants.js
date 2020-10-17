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
	if (typeof selfStream !== 'undefined') {
		this.name = name;
		this.userId = userId;
		var video = selfStream;
		video.id = userId;
	} else {
		this.name = name;
		this.userId = userId;
		var div=document.createElement('div');
		div.classList.add('videoDiv');
		var span = document.createElement('span');
		var video = document.createElement('video');

		div.appendChild(span);
		div.appendChild(video);
		container.appendChild(div);

		span.appendChild(document.createTextNode(name));

		video.id = userId;
		video.autoplay = true;
		video.controls = false;
	}

	this.getVideoElement = function () {
		return video;
	}
	this.changeVideoElementToAudioElement = function () {
		var audio= document.createElement('audio');
		audio.id=this.userId;
		audio.autoplay = true;
		let div=video.parentNode;
		div.replaceChild(audio, video);
		video=audio;
	}


	this.offerToReceiveVideo = function (error, offerSdp, wp) {
		if (error) return console.error("sdp offer error")
		console.log('Invoking SDP offer callback function');
		var msg = {
			id: "receiveVideoFrom",
			sender: this.userId,
			sdpOffer: offerSdp
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

	Object.defineProperty(this, 'rtcPeer', {writable: true});

	this.dispose = function () {
		console.log('Disposing participant ' + this.name);
		this.rtcPeer.dispose();

		let div=video.parentNode;
		div.remove();
	};
	this.disposeSelf = function () {
		console.log('Disposing self ' + this.name);
		this.rtcPeer.dispose();

	}
}