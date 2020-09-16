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

navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    selfVideoElement.srcObject=stream;
    document.getElementById('audioOn').disabled=true;

  })
  .catch(error => {

    handleError(error);
    console.error("EE: " + error);
  });

function enter() {
  if (selfVideoElement.srcObject===null){
    alert("Please enable audio");
    return;
  }
  socket.emit("newUser", roomId);
  document.getElementById('enterTheRoom').style.display='none';


}

// 1)
socket.on("newUser", (newUserId, roomId) => {
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
* chat handler
* */



function sendMessage(elm) {
  var textarea = document.getElementById('message');
  socket.emit('chat message', textarea.value, roomId);
  textarea.value='';
}
socket.on('chat message', function(msg){
  let chat=document.getElementById('messages');
  let messagesDiv=document.createElement('DIV');
  messagesDiv.innerText=msg;
  chat.appendChild(messagesDiv);
  chat.scrollTop=chat.scrollHeight;
});




