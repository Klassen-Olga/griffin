
let Controller = require('../core/controller');

class PagesController extends Controller{
	constructor(req, res, action, rooter) {
		super(req, res, action, rooter);
		const self=this;

	}
	actionHome(){
		const self=this;
		self.render({
			title:"Home"
		});
	}
	actionVideoStream(){
		const self=this;
		self.render({
			title:"Video Stream"
		});
	}
	actionRoom(){
		const self=this;
		self.render({
			title:"Chat Room"
		});
	}
	actionLogin(){
		const self=this;
		self.render({
			title:"Login"
		});
	}
	actionKurentoExampleHelloWorld(){
		const self=this;
		self.render({
			title:"HelloWorld"
		});
	}
	actionKurento(){
		const self=this;
		self.render({
			title:"HelloWorld"
		});
	}
	validateRegisterForm(errors, user) {
		if (user.fullName.length<2){
			errors.push("Full name should be minimum 2 characters");
		}
		const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (re.test(user.email.toLowerCase())===false){
			errors.push("The email is of an incorrect format");

		}
	}
	actionRegister(){
		const self=this;
		let personalData={
			email: self.param('email')
		};
		console.log(personalData)
		if (personalData==null){
			self.render({
				title:"Register",
				self:self
			});
			return;
		}
		let errors=[];


		self.validateRegisterForm(errors, personalData);
		if (errors.length===0){
			self.render({
				title:"Register",
				self:self
			});
		}
		else{
			self.render({
				title:"lolo",
				errors:errors,
				self:self
			});
		}

	}

}
module.exports=PagesController;
