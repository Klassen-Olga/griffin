let Controller = require('../core/controller');
const path = require('path');

class PagesController extends Controller {
	constructor(req, res, action, router) {
		super(req, res, action, router);
		const self = this;
		/*self.before(['*', '-register', '-login', '-room'], (next) => {
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
		});*/

	}

	actionHome() {
		const self = this;
		self.render({
			title: "Home"
		});
	}

	actionRoom() {
		const self = this;
		self.render({
			title: "Chat Room",
			roomId: self.req.params.roomId,
			participantsNumber: self.req.params.participantsNumber
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

module.exports = PagesController;
