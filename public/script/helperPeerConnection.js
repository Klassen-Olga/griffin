/*
function handleError(error) {
	if ((error.name === 'NotFoundError') || (error.name === 'DevicesNotFoundError')) {
		alert("Your device is disabled or you don't have appropriate one");
	} else if ((error.name === 'NotAllowedError') || (error.name === 'PermissionDeniedError')) {
		alert("Access to your device was denied, please check your browser settings");
	} else if ((error.name === 'NotReadableError') || (error.name === 'TrackStartError')) {
		alert("Requested device is already in use");
	} else if ((error.name === 'OverconstrainedError') || (error.name === 'ConstraintNotSatisfiedError')) {
		alert(error.message);
	}
}
*/

/*
* This module contains help functions for peerConnectionHandler module
* */


/**
 *
 * The function used to turn on a user's video or audio only if the user gave permissions to them.
 *              is onclick function for buttons with microphone or camera icons
 *
 * @param {string} mediaType 'video' or 'audio'

 */
function addMediaTrack(mediaType) {
	if (selfVideoElement.srcObject === null) {
		alert("Please restart the page and enable any " + mediaType + " device");
		return;
	} else {
		if (getTracksFromStream(selfVideoElement.srcObject, mediaType).length === 0) {
			alert("Please restart the page and enable any " + mediaType + " device");
			return;
		}
	}

	let tracks = getTracksFromStream(selfVideoElement.srcObject, mediaType);
	if ((tracks !== undefined) && tracks.length > 0) {
		toggleMediaButtons(mediaType, true);
		tracks[0].enabled = true;
		if (mediaType==='video'){
			//case user is in the room and he turns video on
			informUsersVideoOn();
			//case user is not in the room and he turn video on
			videoBeforeEnterTheRoom=true;

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
	if (selfVideoElement.srcObject !== null) {
		if (deviceType === 'video' && selfVideoElement.srcObject.getVideoTracks().length>0) {
			selfVideoElement.srcObject.getVideoTracks()[0].enabled = false;
			//case is in the room and user turns off camera
			informUsersVideoOff();
			//case user is not in the room and we turn video off
			videoBeforeEnterTheRoom=false;

		} else if (deviceType === 'audio'&& selfVideoElement.srcObject.getAudioTracks().length>0) {
			selfVideoElement.srcObject.getAudioTracks()[0].enabled = false;
			audioBeforeEnterTheRoom=false;
		}
		toggleMediaButtons(deviceType, false);
	}
}




