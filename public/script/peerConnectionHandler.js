//all remote peer connections
const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

const socket = io.connect(window.location.origin);
const selfVideoElement = document.getElementById("selfStream");

function enter() {
  socket.emit("newUser");

}

// 1)
socket.on("newUser", (newUserId) => {
  socket.emit("requestForOffer", newUserId);
});


// 2) my conn
socket.on("requestForOffer", oldUserId => {
  //create peer connection
  const peerConnection = createPeerConnection(oldUserId);

  peerConnections[oldUserId] = peerConnection;


  //if  any iceCandidate appears, emit candidate event
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      console.log("event-candiate-client: " + event.candidate)
      socket.emit("candidate", oldUserId, event.candidate);
    }
  };
  //create session description and send it to watcher
  peerConnection
    .createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true})
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", oldUserId, peerConnection.localDescription);
    });
});


// 3-4) their
socket.on("offer", (newUserId, description) => {
  const peerConnection = createPeerConnection(newUserId);

  peerConnections[newUserId] = peerConnection;
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", newUserId, peerConnection.localDescription);
    });

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", newUserId, event.candidate);
    }
  };
});


// 5)
socket.on("answer", (oldUserId, description) => {
  peerConnections[oldUserId].setRemoteDescription(description);
});


socket.on("candidate", (id, candidate) => {

  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));

  console.log(JSON.stringify(peerConnections));

});


socket.on("disconnectPeer", id => {
  peerConnections[id].iceConnectionState === 'disconnected';
  peerConnections[id].close();
  let video = document.getElementById(id);
  let div = document.getElementById('foreignVideoContainer');
  div.removeChild(video);
});


socket.on("audioOnAnswer", (userWhichAddedAudioTrack, description) => {
  peerConnections[userWhichAddedAudioTrack]
    .setRemoteDescription(description)
    .then(() => peerConnections[userWhichAddedAudioTrack].createAnswer())
    .then(sdp => peerConnections[userWhichAddedAudioTrack].setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", userWhichAddedAudioTrack, peerConnections[userWhichAddedAudioTrack].localDescription);
    });

})

function createPeerConnection(id) {

  const peerConnection = new RTCPeerConnection(config);
  peerConnection.id = id;
  let stream = selfVideoElement.srcObject;

  if (stream !== null) {
    stream.getTracks().forEach(track => {
      console.log(peerConnection.addTrack(track, stream));
    })
  }


  peerConnection.onnegotiationneeded = function () {

    console.log('NEGOTIATION NEEDED');
  }
  peerConnection.ontrack = (event) => {
    console.log('On track event for user with id ' + id + ' ' + ' number of tracks ' + JSON.stringify(event.streams[0].getTracks().length));

    let video = document.getElementById(id);

    if (document.getElementById(id) === null) {
      let foreignVideoContainer = document.getElementById("foreignVideoContainer");
      let video = document.createElement("video");
      video.setAttribute('id', id);
      video.setAttribute("autoplay", true);
      video.setAttribute("playsinline", true);
      video.setAttribute("controls", false);
      video.srcObject = event.streams[0];
      foreignVideoContainer.appendChild(video);

    } else {
      video.srcObject = null;
      video.srcObject = event.streams[0];
    }

  };

  return peerConnection;
}

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

/*
* Allows adding of media track before and after the connection was established
*
* */
function addMediaTrack(boolVideo, boolAudio) {

  //toggle media track after it was already added
  if (selfVideoElement.srcObject !== null) {
    let tracks = getTracksFromStream(selfVideoElement.srcObject, boolVideo);
    if (( tracks!==undefined) && tracks.length > 0) {
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
    } else if (deviceType === 'audio') {
      selfVideoElement.srcObject.getAudioTracks()[0].enabled = false;

    }
  }

}
