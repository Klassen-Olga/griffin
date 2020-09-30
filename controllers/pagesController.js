
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
	actionRegister(){
		const self=this;


		let personalData=self.param('user');
		self.render({
			title:"Register",
			self:self
		});
	}
}
module.exports=PagesController;
