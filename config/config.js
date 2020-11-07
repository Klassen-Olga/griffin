module.exports = {
	secret: process.env.SECRET || '3691308f2a4c2f6983f2880d32e29c84',
	jwtExpiresAfter:60*60*3000,
	cookieName: 'it_jwt',
	maxUsersNumberPeerConnection:4
}