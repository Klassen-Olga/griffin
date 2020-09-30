const path = require('path');
const renderOptions={
	layoutFileName:'layout.ejs'
}

class Controller{

	constructor(req, res, action, rooter) {
		const self=this;
		self.req=req;
		self.res=res;
		self.action=action;
		self.rooter=rooter;
	}
	render(options){
		const self=this;
		let controllerName =self.constructor.name;
		controllerName=controllerName.replace('Controller', '');
		let filePath=path.join(controllerName.charAt(0).toLowerCase()+controllerName.substr(1),self.action+'.ejs');
		if (options.hasOwnProperty('layout')===false){
			options.layout=renderOptions.layoutFileName;
		}
		self.res.render(filePath, options);
	}
	param(key) {
		const self = this;

		console.log(self.req.body);
		if (self.req.query && self.req.query[key] !== undefined) {
			return self.req.query[key];
		} else if (self.req.body && self.req.body[key] !== undefined) {
			return self.req.body[key];
		} else if (self.req.body && self.req.body[key] !== undefined) {
			return self.req.body[key];
		}

		return self.req.params[key];
	}
}
module.exports=Controller;
