
const { v4:uuidv4} = require('uuid');

class SocketHandler {

  constructor(io) {
    const self = this;
    self.io = io;
    //object for sockets
    self.sockets = {};
    self.initEvents();



  }

  initEventsForRooms() {
    self.io.on('connection', socket => {

      socket.on('newUser', () => {
        socket.join("room1");
        socket.to("room1").broadcast.emit('userConnected', socket.id);
      });

      socket.on('disconnect', ()=>{
        socket.to("room1").broadcast.emit("userDisconnected", socket.id);
      });
    })
  }

  initEvents() {
    const self = this;
    self.io.on('connection', (socket) => {
      self.sockets[socket.id] = socket;

      socket.on('disconnect', () => {
        console.log('disconnect client', socket.id)
        if (self.sockets[socket.id]) {
          delete self.sockets[socket.id];
        }
      });
      // 1)
      socket.on("newUser", (roomId) => {
        console.log("newUser "+socket.id+ " sends data to all users");
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("newUser", socket.id);
        socket.on("disconnect", () => {
          socket.leave(roomId);
          socket.to(roomId).broadcast.emit("disconnectPeer", socket.id);
        });
      });
      // 1)
      socket.on("requestForOffer", (newUserId, fullName) => {
        console.log(fullName);
        console.log("requestForOffer from old "+socket.id +" to new "+newUserId);

        socket.to(newUserId).emit("requestForOffer", socket.id, fullName);
      });
      // 2)
      socket.on("offer", (oldUserId, message, fullName ) => {
        console.log("offer from new "+socket.id + " to old user "+ oldUserId);

        socket.to(oldUserId).emit("offer", socket.id, message, fullName);
      });
      // 4) this is only for me to register another users
      socket.on("answer", (newUserId, message) => {
        console.log("answer from "+socket.id+ " to new "+newUserId);

        socket.to(newUserId).emit("answer", socket.id, message);
      });
      socket.on("candidate", (id, message) => {
        console.log("new candidate "+id+ " for "+ socket.id);

        socket.to(id).emit("candidate", socket.id, message);
      });

      socket.on("audioOnOffer", (description, userIdToSendHimOffer)=>{
        console.log("offer for audio from "+ socket.id + "to "+ userIdToSendHimOffer);

        socket.to(userIdToSendHimOffer).emit("audioOnAnswer", socket.id, description);
      });



      /*
      * CHAT EVENTS
      * */
      socket.on('chat message', (msg, roomId) => {
        console.log('message: ' + msg);
        self.io.in(roomId).emit('chat message', msg);
      });

      /*
      * Link generator event
      * */

      socket.on('uuid',()=>{
        socket.emit('uuid', uuidv4());
      });
    });
  }
}

module.exports = SocketHandler;
