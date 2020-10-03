const mongoose =require('mongoose');

class User{
    constructor(){
        const self=this;

        let Schema=mongoose.Schema;

        let userSchema= new Schema({
            firstName:{type:String, minLength:2},
            lastName:{type:String, minLength:2},
            email:{type:String, minLength:5},
            passwordHash: String,
        }, {timestamps:true});
    }
    /*
    *
    * const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://new_user_db:123qweASD@cluster0.vbqmv.azure.mongodb.net/griffinDB?retryWrites=true&w=majority\n'
  , {useNewUrlParser: true, useUnifiedTopology: true});


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('// we are connected');
});
let Schema = mongoose.Schema;


const userSchema = Schema({
  _id: Schema.Types.ObjectId,
  fullName: {type: String, minLength: 2},
  email: {type: String, minLength: 5},
  passwordHash: String
});

const roomSchema = Schema({
  _id: Schema.Types.ObjectId,
  uuid: String,
  startDateTime: {type: Date, default: Date.now},
  moderator: {type: Schema.Types.ObjectId, ref: 'User'},
  usersNumber: Number,

});


const messageSchema = Schema({
  text: String,
  fromUser: {type: Schema.Types.ObjectId, ref: "User"},
  toUser: {type: Schema.Types.ObjectId, ref: "User"},
  room: {type: Schema.Types.ObjectId, ref: "ConferenceRoom"}

});

const ConferenceRoom = mongoose.model('ConferenceRoom', roomSchema);
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);




async function setDb() {

  const user1 = new User({
    _id: new mongoose.Types.ObjectId(),
    fullName: 'Olga',
    email: 'klassen.olga@gmail.com',
    passwordHash: "olga"
  });

  const user2 = new User({
    _id: new mongoose.Types.ObjectId(),
    fullName: 'Valea',
    email: 'Valea.Moon@gmail.com',
    passwordHash: "valea"
  });
  const room1 = new ConferenceRoom({
    _id: new mongoose.Types.ObjectId(),
    startDateTime: '2020-10-10T13:18:06.070+00:00',
    usersNumber: 3
  });

  try {


    let user1Db = await user1.save();
    let user2Db = await user2.save();

   room1.moderator= user1._id;

    let room1Db= await room1.save();

    const message=new Message({
      _id: new mongoose.Types.ObjectId(),
      text: 'Hello',
      fromUser: user1Db._id,
      toUser: user2Db._id,
      room: room1Db._id

    });
    let messageDb=await message.save();

  } catch (e) {
    console.log(e);
  }
}
setDb();
/*ConferenceRoom.findOne({usersNumber: 3}, function (err, room) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(room.moderator + ' ' + room.startDateTime);

});


ConferenceRoom.findOne({usersNumber:3}).populate('moderatorId').exec((err, room)=>{
  if (err) {
    console.log(err);
    return;
  }
  console.log(room.moderator + ' ' + room.moderator.firstName);

});*/


}
