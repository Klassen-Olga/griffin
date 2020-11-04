const Controller = require('../mainController');
const ApiError = require('../../core/error');
const Passport=require('../../core/passport');

class ApiUsersController extends Controller {
	constructor(...args) {
		super(...args);
		const self = this;
		self.format = Controller.HTTP_FORMAT_JSON;

	}

	actionNewRoom(){
		const self=this;

	}
}

module.exports = ApiUsersController;