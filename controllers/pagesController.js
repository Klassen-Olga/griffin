
let Controller = require('../core/controller');

class PagesController extends Controller{
	constructor(req, res) {
		super(req, res);
		const self=this;
		self.req=req;
		self.res=res;
	}
	actionHome(){
		const self=this;
		self.render("home.ejs", {
			title:"Home"
		});
	}
}
module.exports=PagesController;