const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class Passport {
	static generatePassword(length = 18) {
		//generiert random data
		let hash = crypto.randomBytes(length).toString('hex');
		hash = hash.substring(0, length);
		return hash;
	}
	//hashes a string
	static hashPassword(str){
		return bcrypt.hashSync(str, 10);
	}
	static comparePassword(password, hash){
		return bcrypt.compareSync(password, hash);
	}
	static generateJwt(userId){
		let payload={
			//wann wurde das token generiert
			iat:Date.now(),
			exp:Date.now()+config.jwtExpiresAfter,
			id:userId
		};
		return jwt.sign(payload,config.secret);
	}
	//token kann entweder in header sein oder in cookie
	static isAuthorized(request){
		const self=this;
		//check if there is a coockie which has token
		let cookies=self.cookies(request);
		let token=null;
		if(cookies[config.cookieName]){
			token=cookies[config.cookieName];
		}
		if (token!=null){
			try{
				//prueft wenn token signiert ist
				let payload=jwt.verify(token, config.secret);
				if(payload){
					if(payload.exp>Date.now()){
						return payload;
					}
				}

			}catch (e) {
				console.error(e);
			}
		}
		return false;
	}

	static authorizeUserWithCookie(request, response, userId){
		const self=this;
		let token=self.generateJwt(userId);

		response.cookie(config.cookieName, token,{
			maxAge:config.jwtExpiresAfter,
			httpOnly:false,
			secure:request.secure
		});
		return token;
	}
	static async  deleteCookie(request, response){
		let tokenPayload = Passport.isAuthorized(request);
		let payload={
			//wann wurde das token generiert
			iat:Date.now()-10000,
			exp:Date.now()-10000,
			id:tokenPayload.id
		};
		let token= jwt.sign(payload,config.secret);
		response.cookie(config.cookieName, token);
		return token;

	}
	static cookies(request){
		let cookies={};
		let requestCookies=request.headers.cookie;
		if(requestCookies){
			requestCookies=requestCookies.split(';');
			let parts=null;

			for(let i=0;i<requestCookies.length;++i){
				parts=requestCookies[i].split('=');
				cookies[parts[0].trim()]=parts[1];
			}
		}
		return cookies;
	}
	static unauthorizeUser(request, response){
		const self=this;

		response.clearCookie(config.cookieName);



	}
}

module.exports = Passport;