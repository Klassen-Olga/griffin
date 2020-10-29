const path = require('path');
const ApiError = require('./error');

const renderOptions={
	statusCode:200,
	layoutFileName:'layout.ejs'
}

class Controller{

	constructor(req, res, action, router) {
		const self=this;
		self.req=req;
		self.res=res;
		self.action=action;
		self.router=router;
	}
	get database(){
		return this.router.database;
	}
	render(params, options){
		const self=this;
		options = Object.assign({ ...renderOptions }, options);

		if (!options.statusCode){
			options.statusCode=200;
		}
		self.res.status(options.statusCode);

		if (self.format === Controller.HTTP_FORMAT_JSON) {
			let jsonStr = JSON.stringify(params);
			self.res.set('content-type', 'application/json');
			self.res.set('content-length', jsonStr.length);
			self.res.send(jsonStr);
		}
		else{
			let controllerName =self.constructor.name;
			controllerName=controllerName.replace('Controller', '');
			let filePath=path.join(controllerName.charAt(0).toLowerCase()+controllerName.substr(1),self.action+'.ejs');
			self.res.render(filePath, params);
		}

	}
	param(key) {
		const self = this;

		if (self.req.query && self.req.query[key] !== undefined) {
			return self.req.query[key];
		} else if (self.req.body && self.req.body[key] !== undefined) {
			return self.req.body[key];
		} else if (self.req.body && self.req.body[key] !== undefined) {
			return self.req.body[key];
		}

		return self.req.params[key];
	}
	urlFor(...args){
		return this.router.urlFor(...args);
	}



	handleError(error){
		const self = this;

		if (error instanceof ApiError) {
			self.render({
				error: error.message
			}, {
				statusCode: error.statusCode
			})
		} else {
			self.render({
				error: error.message
			}, {
				statusCode: 500
			});
		}
	}
}
Controller.HTTP_FORMAT_JSON = 'JSON';
Controller.HTTP_FORMAT_HTML = 'HTML';
Controller.HTTP_CODE_INTERNAL_SERVER_ERROR = 500;
Controller.HTTP_CODE_NOT_ACCEPTABLE = 406;
Controller.HTTP_CODE_UNAUTHORIZED = 401;
Controller.HTTP_CODE_FORBIDDEN = 403;
Controller.HTTP_CODE_BAD_REQUEST = 400;
Controller.HTTP_CODE_CREATED = 201;
Controller.HTTP_CODE_OK = 200;

module.exports=Controller;
