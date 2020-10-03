let PagesController = require('../controllers/pagesController');
let StreamController = require('../controllers/streamController');
const path = require('path');
let routes = [
	{
		controllerName: PagesController,
		actions: [
			{path: '/', action: 'home', method: 'get'},
			{path: '/videoStream', action: 'videoStream', method: 'get'},
			{path: '/register', action: 'register', method: 'get'},
			{path: '/register', action: 'register', method: 'post'},

			{path: '/room', action: 'room', method: 'get'},
			{path: '/kurentoExampleHelloWorld', action: 'kurentoExampleHelloWorld', method: 'get'},
			{path: '/kurento', action: 'kurento', method: 'get'},
			{path: '/login', action: 'login', method: 'get'}
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
			let controller = new controllerName(request, response, action, self);
			controller[actionName]();
		});
	}
	updateRoutes(uuid){
		const self=this;
		self.app.get('/room/:roomId',(req, res)=>{
			res.render('pages/room', {roomId:req.params.roomId});
		});
		self.app.get('/videoChat', (req, res)=>{
			res.redirect('/room/'+uuid);
		});

	}
	urlFor(controllerName, action) {
		const self = this;
		let filePath=null;
		if (controllerName!=='pages'){
			let filePath=path.join(controllerName.charAt(0).toLowerCase()+controllerName.substr(1),action+'.ejs');
		}
		else{
			let filePath=action+'.ejs';

		}
		return filePath;
	}
}

module.exports = Router;
