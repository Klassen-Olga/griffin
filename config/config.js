module.exports = {
	secret: process.env.SECRET || 'yerfhc98tghf8er83f2880d32e29c84',
	jwtExpiresAfter:60*60*3000,
	cookieName: 'it_jwt',
	maxUsersNumberPeerConnection:4,
	cronTimeZone:'Europe/Berlin'
}