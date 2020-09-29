
let Controller = require('../core/controller');

class PagesController extends Controller{
	constructor(req, res, action) {
		super(req, res, action);
		const self=this;
		self.req=req;
		self.res=res;
		self.broadcaster=null;
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
	actionBroadcast(){
		const self=this;
		self.render({
			title:"Broadcast"
		});
	}
	actionWatch(){
		const self=this;
		self.render({
			title:"Watch"
		});
	}
	actionDuplex(){
		const self=this;
		self.render({
			title:"Duplex"
		});
	}
	actionRoom(){
		const self=this;
		self.render({
			title:"Example"
		});
	}actionRoom(){
		const self=this;
		self.render({
			title:"Chat Room"
		});
	}
}
module.exports=PagesController;
