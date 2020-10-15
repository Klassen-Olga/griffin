function addMediaTrack(boolVideo, boolAudio) {

	if (boolVideo===true){
		participants[Object.keys(participants)[0]].rtcPeer.videoEnabled=true;
		toggleMediaButtons('video', true);

	}
	else{
		participants[Object.keys(participants)[0]].rtcPeer.audioEnabled=true;
		toggleMediaButtons('audio', true);

	}

}
function removeMediaTrack(deviceType) {

	if (deviceType==='video'){
		participants[Object.keys(participants)[0]].rtcPeer.videoEnabled=false;
	}
	else{
		participants[Object.keys(participants)[0]].rtcPeer.audioEnabled=false;
	}
	toggleMediaButtons(deviceType, false);

}