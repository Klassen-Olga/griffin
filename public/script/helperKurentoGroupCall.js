/*
* This module contains help functions for kurentoGroupCall module
* */

window.onload = () => {
	document.getElementById('enterTheRoom').style.display = 'block';
	document.getElementById('leaveTheRoom').style.display = 'none';
}

/**
 *
 * The function used to turn on a user's video or audio only if the user gave permissions to them.
 *              is onclick function for buttons with microphone or camera icons
 *
 * @param {boolean} mediaType 'video' or 'audio'

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
			//notify other users
			sendMessage({id: 'videoEnabled', roomId: roomId});
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
 * The function used to turn off a user's video or audio only if the user gave permissions to them.
 *              is onclick function for buttons with microphone or camera icons
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
			//notify other users
			sendMessage({id: 'videoDisabled', roomId: roomId});
		} else {
			participants[Object.keys(participants)[0]].rtcPeer.audioEnabled = false;
		}
	}
	toggleMediaButtons(deviceType, false);

}


