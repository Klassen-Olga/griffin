module.exports = {
	secret: process.env.SECRET || 'yerfhc98tghf8er83f2880d32e29c84',
	jwtExpiresAfter: 60 * 60 * 3000,
	cookieName: 'it_jwt',
	maxUsersNumberPeerConnection: 4,
	cronTimeZone: 'Europe/Berlin',
	// removes room record, all message, participant, participantInRoom records related to the room
	// after the last participant left the room in "cronRemoveRoomAfter" minutes
	cronRemoveRoomAfter: 60, // in 60 minutes
	stunServer: {
		url: 'stun:stun.l.google.com:19302'
	},
	turnServer: {
		url: '158.69.221.198:3478',
		userName: 'klassen.olga@fh-erfurt.de',
		credential: '123'
	},
	//kurentoMediaServerUrl:'ws://ec2-54-157-113-30.compute-1.amazonaws.com:8888/kurento',
	kurentoMediaServerUrl: process.env.KMS || 'ws://localhost:8888/kurento',
	serverUrl: process.env.APP || 'http://localhost:3000'
}