'use strict';

/**
 *  User session
 */
class Session {


    constructor(socket, userName, roomName) {
        const self=this;
        self.id = socket.id;
        self.socket = socket;

        self.name = userName;
        self.roomName = roomName;

        self.outgoingMedia = null;
        self.incomingMedia = {};

        self.iceCandidateQueue = {};
    }


    addIceCandidate(data, candidate) {
        // self
        const self=this;
        if (data.sender === self.name) {
            // have outgoing media.
            if (self.outgoingMedia) {
                console.log(` add candidate to self : %s`, data.sender);
                self.outgoingMedia.addIceCandidate(candidate);
            } else {
                // save candidate to ice queue.
                console.error(` still does not have outgoing endpoint for ${data.sender}`);
                self.iceCandidateQueue[data.sender].push({
                    data: data,
                    candidate: candidate
                });
            }
        } else {
            // others
            let webRtc = self.incomingMedia[data.sender];
            if (webRtc) {
                console.log(`%s add candidate to from %s`, self.id, data.sender);
                webRtc.addIceCandidate(candidate);
            } else {
                console.error(`${self.id} still does not have endpoint for ${data.sender}`);
                if (!self.iceCandidateQueue[data.sender]) {
                    self.iceCandidateQueue[data.sender] = [];
                }
                self.iceCandidateQueue[data.sender].push({
                    data: data,
                    candidate: candidate
                });
            }
        }
    }


    sendMessage(data) {
        const self=this;

        if (self.socket) {
            self.socket.emit('message', data);
        } else {
            console.error('socket is null');
        }
    }



    setOutgoingMedia(outgoingMedia) {
        const self=this;

        self.outgoingMedia = outgoingMedia;
    }



}
module.exports=Session;
