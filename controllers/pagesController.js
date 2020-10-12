let Controller = require('../core/controller');
class PagesController extends Controller {
	constructor(req, res, action, rooter) {
		super(req, res, action, rooter);
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
	validateRegisterForm(errors, user) {
		if (user.fullName.length < 2) {
			errors.push("Full name should be at least 2 characters long");
		}
		const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (re.test(user.email.toLowerCase()) === false) {
			errors.push("The email is in the wrong format");

		}
		if (user.password!==user.repeatPassword){
			errors.push("Password and repeat password should match");
		}
		if (user.password.length<8){
			errors.push("Your password should be at least 8 characters long");
		}
		const rePass=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
		if (rePass.test(user.password)===false){
			errors.push("Your password should contain at least one character and one number");
		}
	}

	actionRegister() {
		const self = this;


		if (typeof self.param('email') =='undefined') {
			self.render({
				title: "Register",
				self: self
			});
			return;
		}
		let errors = [];

		let personalData = {
			password: self.param('password'),
			repeatPassword: self.param('repeatPassword'),
			fullName: self.param('fullName'),
			email: self.param('email')
		};

		self.validateRegisterForm(errors, personalData);

		if (errors.length === 0) {

			self.render({
				title: "Register",
				self: self
			});
		} else {
			self.render({
				title: "lolo",
				errors: errors,
				self: self
			});
		}

	}

}

module.exports = PagesController;
