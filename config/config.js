module.exports = {
	secret: process.env.SECRET || 'yerfhc98tghf8er83f2880d32e29c84',
	jwtExpiresAfter:60*60*3000,
	cookieName: 'it_jwt',
	maxUsersNumberPeerConnection:4,
	cronTimeZone:'Europe/Berlin',
	// remove room record, all message, participant, participantInRoom records related to the room
	// after the last participant left the room in X minutes
	cronRemoveRoomAfter: 60 // in 60 minutes
}