let PagesController = require('../controllers/pagesController');
let StreamController = require('../controllers/streamController');

let routes = [
	{
		controllerName: PagesController,
		actions: [
			{path: '/', action: 'home', method: 'get'},
			{path: '/videoStream', action: 'videoStream', method: 'get'},
			{path: '/broadcast', action: 'broadcast', method: 'get'},
			{path: '/watch', action: 'watch', method: 'get'},
			{path: '/duplex', action: 'duplex', method: 'get'},
			{path: '/example', action: 'example', method: 'get'},


			{path: '/sign-in', action: 'signin', method: 'get'}
		]
	},
	{
		controllerName: StreamController,
		actions: [
			{path: '/stream/broadcast', action: 'broadcast', method: 'get'},
			{path: '/stream/watch', action: 'watch', method: 'get'}
		]
	}

];

class Router {

	constructor(app) {
		const self = this;
		self.app = app;
	}

	setRoutes() {
		const self = this;
		let route;
		let action;
		for (route of routes) {
			let controllerName = route.controllerName;
			for (action of route.actions) {
				self.setRoute(action.path, action.action, action.method, controllerName);
			}
		}
	}

	setRoute(path, action, method, controllerName) {
		const self = this;
		self.app[method](path, (request, response) => {
			let actionName = 'action' + action.charAt(0).toUpperCase() + action.substr(1);
			let controller = new controllerName(request, response, action);
			controller[actionName]();
		});
	}
}

module.exports = Router;