const path = require('path');
const renderOptions={
	layoutFileName:'layout.ejs'
}

class Controller{

	constructor(req, res, action) {
		const self=this;
		self.req=req;
		self.res=res;
		self.action=action;
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
}
module.exports=Controller;