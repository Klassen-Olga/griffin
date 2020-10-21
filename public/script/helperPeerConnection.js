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
 * @param {boolean} mediaType 'video' or 'audio'

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
	}


}

/**
 * Adds a media track to the source object of any video element before user enters the room
 * @param {*} mediaType 'audio' or 'video' for track type
 * @param {*} stream stream from which tracks should be taken
 * @param {string} videoElement to which source object should be added
 */
function addTrackToSrcObject(mediaType, stream, videoElement) {

	let tracks = getTracksFromStream(stream, mediaType);

	//insert media track for first time
	if (videoElement.srcObject !== null) {
		let localStream = videoElement.srcObject;
		localStream.addTrack(tracks[0]);
		videoElement.srcObject = null;
		videoElement.srcObject = localStream;
	} else {
		videoElement.srcObject = stream;
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

		} else if (deviceType === 'audio'&& selfVideoElement.srcObject.getAudioTracks().length>0) {
			selfVideoElement.srcObject.getAudioTracks()[0].enabled = false;

		}
		toggleMediaButtons(deviceType, false);
	}
}

function getTracksFromStream(stream, mediaType) {
	let tracks = null;
	if (mediaType === 'video') {
		tracks = stream.getVideoTracks();
	} else {
		tracks = stream.getAudioTracks();
	}
	return tracks;
}




