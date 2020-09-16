
function handleError(error){
  if((error.name === 'NotFoundError' )||( error.name ===  'DevicesNotFoundError')){
    alert("Your device is disabled or you don't have appropriate one");
  }
  else if((error.name === 'NotAllowedError' )||( error.name ===  'PermissionDeniedError')){
    alert("Access to your device was denied, please check your browser settings");
  }
  else if((error.name === 'NotReadableError' )||( error.name ===  'TrackStartError')){
    alert("Requested device is already in use");
  }
  else if((error.name === 'OverconstrainedError' )||( error.name ===  'ConstraintNotSatisfiedError')){
    alert(error.message);
  }
}

/*
* Allows adding of media track before and after the connection was established
*
* */
function addMediaTrack(boolVideo, boolAudio) {

  //toggle media track after it was already added
  if (selfVideoElement.srcObject !== null) {
    let tracks = getTracksFromStream(selfVideoElement.srcObject, boolVideo);
    if (( tracks!==undefined) && tracks.length > 0) {
      if (boolVideo==true){
        document.getElementById('videoOff').disabled=false;
        document.getElementById('videoOn').disabled=true;
      }
      else{
        document.getElementById('audioOff').disabled=false;
        document.getElementById('audioOn').disabled=true;
      }
      tracks[0].enabled = true;
      return;
    }

  }
  //insert media track for first time
  navigator.mediaDevices.getUserMedia({video: boolVideo, audio: boolAudio})
    .then(stream => {
      let tracks = getTracksFromStream(stream, boolVideo);
      if (selfVideoElement.srcObject !== null) {
        let localStream = selfVideoElement.srcObject;
        localStream.addTrack(tracks[0]);
        selfVideoElement.srcObject = null;
        selfVideoElement.srcObject = localStream;
      } else {
        selfVideoElement.srcObject = stream;
      }
      if (boolVideo==true){
        document.getElementById('videoOff').disabled=false;
        document.getElementById('videoOn').disabled=true;
      }
      else{
        document.getElementById('audioOff').disabled=false;
        document.getElementById('audioOn').disabled=true;
      }
      updateTracksOnRemotePeers(tracks);

    })
    .catch(error => {

      handleError(error);
      console.error("EE: " + error);
    });
}


function getTracksFromStream(stream, boolVideo) {
  let tracks = null;
  if (boolVideo === true) {
    tracks = stream.getVideoTracks();
  } else {
    tracks = stream.getAudioTracks();
  }
  return tracks;
}

async function updateTracksOnRemotePeers(tracks) {
  for (let key in peerConnections) {
    if (peerConnections.hasOwnProperty(key)) {
      peerConnections[key].addTrack(tracks[0], selfVideoElement.srcObject);
      let sdp = await peerConnections[key].createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true});
      await peerConnections[key].setLocalDescription(sdp);
      await socket.emit("audioOnOffer", peerConnections[key].localDescription, key);
    }
  }
}

function removeMediaTrack(deviceType) {
  if (selfVideoElement.srcObject !== null) {
    if (deviceType === 'video') {
      selfVideoElement.srcObject.getVideoTracks()[0].enabled = false;
      document.getElementById('videoOff').disabled = true;
      document.getElementById('videoOn').disabled = false;

    } else if (deviceType === 'audio') {
      selfVideoElement.srcObject.getAudioTracks()[0].enabled = false;
      document.getElementById('audioOff').disabled = true;
      document.getElementById('audioOn').disabled = false;

    }
  }
}
