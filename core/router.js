let PagesController    = require('../controllers/pagesController');

let ApiUsersController = require('../controllers/api/usersController');
const path = require('path');
let routes = {
	'pages': {
		controllerName: PagesController,
		actions: [
			{path: '/', action: 'home', method: 'get'},
			{path: '/videoStream', action: 'videoStream', method: 'get'},
			{path: '/register', action: 'register', method: 'get'},
			{path: '/register', action: 'register', method: 'post'},

			{path: '/room', action: 'room', method: 'get'},
			{path: '/kurentoExampleHelloWorld', action: 'kurentoExampleHelloWorld', method: 'get'},
			{path: '/kurentoOneToOne', action: 'kurentoOneToOne', method: 'get'},
			{path: '/kurentoOneToMany', action: 'kurentoOneToMany', method: 'get'},
			{path: '/kurentoManyToMany', action: 'kurentoManyToMany', method: 'get'},
			{path: '/login', action: 'login', method: 'get'}]

	},
	'api/users': {
		controllerName: ApiUsersController,
		actions: [
			{path: '/api/users', action: 'register', method: 'post'},]
	}
};

class Router {

	constructor(app, db) {
		const self = this;
		self.app = app;
		self.database = db;
		self.hashMap = [];

	}

	setRoutes() {
		const self = this;
		let action;
		for (let i in routes) {
			let controllerName = routes[i].controllerName;
			for (action of routes[i].actions) {
				self.setRoute(action.path, action.action, action.method, controllerName);
				self.generatePaths(action, i);
			}
		}
	}

	generatePaths(action, controllerName) {
		const self = this;
		let hash = controllerName + action.action + action.method.toLowerCase();
		const str = action.path;
		let match;
		let urlParameters = [];

		const regexParams = /:([a-zA-Z](?:[a-zA-Z0-9]+))?/g;
		while ((match = regexParams.exec(str)) != null) {
			//match.index === match["index"]
			if (match.index === regexParams.lastIndex) {
				++regexParams.lastIndex;
			}

			urlParameters.push(match[1]);
		}
		urlParameters.sort();
		if (urlParameters.length > 0) {
			hash += urlParameters.join('');
		}
		self.hashMap[hash] = action.path;
	}

	setRoute(path, action, method, controllerName) {
		const self = this;
		self.app[method](path, (request, response) => {
			let actionName = 'action' + action.charAt(0).toUpperCase() + action.substr(1);
			let controller = new controllerName(request, response, action, self);
			controller[actionName]();
		});
	}

	updateRoutes(uuid) {
		const self = this;
		self.app.get('/room/:roomId/:participantsNumber', (req, res) => {
			res.render('pages/room', {
				roomId: req.params.roomId,
				participantsNumber: req.params.participantsNumber
			});


		});
		self.app.get('/room/:roomId', (req, res) => {
			res.render('pages/room', {
				roomId: req.params.roomId,
				participantsNumber: 'undefined'
			});

		});
		self.app.get('/videoChat', (req, res) => {
			res.redirect('/room/' + uuid);
		});

	}

	urlFor(controllerName, action, parameters = null, method = 'GET') {
		const self = this;
		let hash = controllerName + action + method.toLocaleLowerCase();
		let paramsKeys = null;
		if (parameters != null) {
			paramsKeys = Object.keys(parameters).sort();
			hash += paramsKeys.join('');
		}
		let path = '/';
		if (self.hashMap[hash]) {
			path = self.hashMap[hash];
			if (paramsKeys != null) {
				for (let index = 0; index < paramsKeys.length; ++index) {
					path = path.replace(':' + paramsKeys[index], parameters[paramsKeys[index]]);
				}
			}

		} else {
			console.error("Can not generate any url for controller name: "
				+ controllerName + " action: " + action + "method: " + method + "parameters :" + parameters);
		}
		console.log(path);
		return path;
	}
}

module.exports = Router;
