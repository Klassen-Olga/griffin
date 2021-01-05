let Controller = require('./mainController');
const path = require('path');
const SocketHelper=require('../helpers/socketHelper');
class PagesController extends Controller {
	constructor(req, res, action, router) {
		super(req, res, action, router);
		const self = this;
		self.socketHelper=new SocketHelper(self.database);
		self.before(['*', '-register', '-login', '-room', '-error', '-imprint'], (next) => {
			if (self.req.authorized === true) {
				next();
			} else {
				self.res.redirect(302, self.urlFor('pages', 'login'));
			}
		});
		self.before(['login'], (next) => {
			if (self.req.authorized === true) {
				self.res.redirect(self.urlFor('pages', 'home'));
			} else {
				next();
			}
		});
		self.before('room', async (next) => {
			let error = null;
			try {
				let dbRoom=await self.socketHelper.findRoom(self.req.params.roomId);

				if (!dbRoom) {
					error = 'Please check if the url link is correct';
				}
			} catch (e) {
				console.log(e.message);
				error = e;
			}

			if (error) {
				self.res.redirect(self.urlFor('pages', 'error', {errorMessage: error, statusCode: 404}));
			} else {
				next();
			}
		})

	}

	actionError() {
		const self = this;

		self.render({
			title: "Error",
			error: self.req.params.errorMessage,
			statusCode: self.req.params.statusCode
		}, {statusCode: parseInt(self.req.params.statusCode)});
	}

	actionHome() {
		const self = this;
		self.render({
			title: "Home"
		});
	}
	actionImprint() {
		const self = this;
		self.render({
			title: "Imprint"
		});
	}

	async actionRoom() {
		const self = this;

		self.render({
			stunUrl:config.stunServer.url,
			turnUrl:config.turnServer.url,
			turnCredential:config.turnServer.credential,
			turnUsername:config.turnServer.userName,
			title: "Chat Room",
			roomId: self.req.params.roomId,
			participantsNumber: self.req.params.participantsNumber,
			dbId: self.req.user ? self.req.user.id : null,
			reduceFramerateKurento:config.reduceFramerateKurento
		});
	}

	actionLogin() {
		const self = this;
		self.render({
			title: "Login"
		});
	}

	actionRegister() {
		const self = this;
		self.render({
			title: "Register"
		});

	}

}

//1466211850

module.exports = PagesController;
