
class Controller{

	constructor(req, res) {
		const self=this;
		self.req=req;
		self.res=res;
	}
	render(path, options){
		const self=this;
		self.res.render(path, options);
	}
}
module.exports=Controller;