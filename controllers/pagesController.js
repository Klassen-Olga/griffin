let Controller = require('../core/controller');

class PagesController extends Controller {
	constructor(req, res, action, router) {
		super(req, res, action, router);
		const self = this;

	}

	actionHome() {
		const self = this;
		self.render({
			title: "Home"
		});
	}

	actionVideoStream() {
		const self = this;
		self.render({
			title: "Video Stream"
		});
	}

	actionRoom() {
		const self = this;
		self.render({
			title: "Chat Room"
		});
	}

	actionLogin() {
		const self = this;
		self.render({
			title: "Login"
		});
	}

	actionKurentoExampleHelloWorld() {
		const self = this;
		self.render({
			title: "HelloWorld"
		});
	}


	actionKurentoOneToOne() {
		const self = this;
		self.render({
			title: "OneToOne"
		});
	}

	actionKurentoOneToMany() {
		const self = this;
		self.render({
			title: "OneToMany"
		});
	}

	actionKurentoManyToMany() {
		const self = this;
		self.render({
			title: "ManyToMany"
		});
	}

	actionRegister() {
		const self = this;
		self.render({
			title: "Register",
			self: self
		});


	}

}

module.exports = PagesController;
