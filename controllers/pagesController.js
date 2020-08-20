
let Controller = require('../core/controller');

class PagesController extends Controller{
	constructor(req, res, action) {
		super(req, res, action);
		const self=this;
		self.req=req;
		self.res=res;
	}
	actionHome(){
		const self=this;
		self.render({
			title:"Home"
		});
	}
}
module.exports=PagesController;