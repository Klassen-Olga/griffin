let express = require('express');
let app = express();
let http = require("http").createServer(app);

app.use(express.static('public'));
app.set('view engine', 'ejs');

let Router = require('./core/router');
let router = new Router(app);
router.setRoutes();

let io = require('socket.io')(http);
const { v4:uuidv4} = require('uuid');

let uuid= uuidv4();
console.log(uuid);
router.updateRoutes(uuid);

let SocketHandler=require('./core/socket');
let socketHandler=new SocketHandler(io);

const mongoose =require('mongoose');

mongoose.connect('mongodb+srv://new_user_db:123qweASD@cluster0.vbqmv.azure.mongodb.net/griffinDB?retryWrites=true&w=majority\n'
,{useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('// we are connected');
});
let Schema=mongoose.Schema;

let conferenceRoomSchema= new Schema({
	startDateTime:{ type : Date, default: Date.now },
	usersNumber:Number,
	userModeratorId:{type:Schema.Types.ObjectId, ref:'users'}

}, {timestamps:true});
const ConferenceRoom=mongoose.model('ConferenceRoom', conferenceRoomSchema);
let userSchema= new Schema({
	firstName:{type:String, minLength:2},
	lastName:{type:String, minLength:2},
	email:{type:String, minLength:5},
	passwordHash: String,
}, {timestamps:true});
const User=mongoose.model('User', userSchema);

let messageSchema= new Schema({
	fromUserId:{type:Schema.Types.ObjectId, ref:'User'},
	toUserId:{type:Schema.Types.ObjectId, ref:'User'},
	conferenceRoomId:{type:Schema.Types.ObjectId, ref:'ConferenceRoom'},
	text:{type:String},
}, {timestamps:true});
const Message=mongoose.model('Message', messageSchema);

var olga=User({
	firstName: 'Olga',
	lastName: 'Klassen',
	email: 'klassen.olga@gmail.com',
	passwordHash: "olga"
});
var confRoom1=ConferenceRoom({
	startDateTime:'2020-10-10T13:18:06.070+00:00',
	usersNumber: 3,
	usersModeratorId:'5f6503a60a4b4056a2a0eef2'
});
confRoom1.save(err=>{
	if (err){
		console.log(err);
	}
});
/*olga.save(function (err, user) {
	if (err) {
		console.error(err);
		return;
	}

})*/
/*
ConferenceRoom.findOne({_id:'5f65049f7fe7cb572440ea60'})
	.populate('users'/!*, 'email lastName'*!/).exec((err, room)=>{
		if (err){
			console.log(err);
		}
	console.log(room.startTime + ' ' + room.users.email);
	});
*/

let olgas= User.findOne({firstName:'Olga'}, 'lastName, email', function (err, user) {
	if (!err){

		console.log(user.email+' '+user._id);
	}

});
http.listen(3000, '127.0.0.1', function () {
	console.log('App listening at http://localhost:3000/broadcast\nApp listening at http://localhost:3000/watch' +
		'\nApp listening at http://localhost:3000/room' +
		'\nApp listening at http://localhost:3000/videoChat');
});
