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
*
*
* */

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

function addTrackToSrcObject(mediaType, stream) {

	let tracks = getTracksFromStream(stream, mediaType);

	//insert media track for first time
	if (selfVideoElement.srcObject !== null) {
		let localStream = selfVideoElement.srcObject;
		localStream.addTrack(tracks[0]);
		selfVideoElement.srcObject = null;
		selfVideoElement.srcObject = localStream;
	} else {
		selfVideoElement.srcObject = stream;
	}

}

function removeMediaTrack(deviceType) {
	if (selfVideoElement.srcObject !== null) {
		if (deviceType === 'video') {
			selfVideoElement.srcObject.getVideoTracks()[0].enabled = false;

		} else if (deviceType === 'audio') {
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




