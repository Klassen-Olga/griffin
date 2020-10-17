window.onload = () => {
	document.getElementById('enterTheRoom').style.display = 'block';
	document.getElementById('leaveTheRoom').style.display = 'none';
}

/**
 *
 * function used to turn on a user's video or audio
 * will be called from certain buttons with microphone or camera icons
 *
 * @param {boolean} boolVideo true if user wants to make camera on

 */
function addMediaTrack(mediaType) {

	//user wants to make the video on
	if (mediaType === 'video') {
		// no video device available but user wants to make it on
		if (acceptVideo === false) {
			alert("Please restart the page and enable any video device");
			return;
		}
		//before user entered the room
		if (typeof participants[Object.keys(participants)[0]] === 'undefined') {
			videoBeforeEnterTheRoom = true;
			document.getElementById('videoTest').srcObject.getVideoTracks()[0].enabled = true;
			toggleMediaButtons('video', true);

		} else {
			participants[Object.keys(participants)[0]].rtcPeer.videoEnabled = true;
			toggleMediaButtons('video', true);
		}
	}
	//user wants to make the audio on
	else {
		// no audio device available but user wants to make it on
		if (acceptAudio === false) {
			alert("Please restart the page and enable any audio device");
			return;
		}
		//before user entered the room
		if (typeof participants[Object.keys(participants)[0]] === 'undefined') {
			audioBeforeEnterTheRoom = true;
			toggleMediaButtons('audio', true);
		} else {
			participants[Object.keys(participants)[0]].rtcPeer.audioEnabled = true;
			toggleMediaButtons('audio', true);
		}
	}
}
/**
 *
 * function used to turn off a user's video or audio
 * will be called from certain buttons with microphone or camera icons
 *
 * @param {string} deviceType 'video' or 'audio'
 */
function removeMediaTrack(deviceType) {

	//before user entered the room
	if (typeof participants[Object.keys(participants)[0]] === 'undefined') {
		if (deviceType === 'video') {
			videoBeforeEnterTheRoom = false;
			document.getElementById('videoTest').srcObject.getVideoTracks()[0].enabled = false;
		} else if (deviceType === 'audio') {
			audioBeforeEnterTheRoom = false;
		}

	} else {
		if (deviceType === 'video') {
			participants[Object.keys(participants)[0]].rtcPeer.videoEnabled = false;
		} else {
			participants[Object.keys(participants)[0]].rtcPeer.audioEnabled = false;
		}
	}
	toggleMediaButtons(deviceType, false);

}


