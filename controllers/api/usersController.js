const Controller = require('../../core/controller');
const ApiError = require('../../core/error');

class ApiUsersController extends Controller {
	constructor(...args) {
		super(...args);
		const self=this;
		self.format = Controller.HTTP_FORMAT_JSON;

	}

	undefinedCheck(data){
		for(let i in data){
			if (typeof data[i]==='undefined'){
				return false;
			}
		}
		return true;
	}
	validateRegisterForm(user) {
		const self=this;
		let error='';

		if (self.undefinedCheck(user)===false){
			error="Reload the page";
		}
		self.undefinedCheck(user);
		if (user.firstName.length < 2) {
			error="Full name should be at least 2 characters long";
		}
		if (user.lastName.length < 2) {
			error = "Last name should be at least 2 characters long";
		}
		const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (re.test(user.email.toLowerCase()) === false) {
			error = "The email is in the wrong format";

		}
		/*if (user.password!==user.repeatPassword){
			error="Password and repeat password should match";

		}
		if (user.password.length<8){
			error="Your password should be at least 8 characters long";
		}
		const rePass=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
		if (rePass.test(user.password)===false){
			error="Your password should contain at least one character and one number";
		}*/
		return error;
	}

	actionRegister() {
		const self = this;
		let error = '';
		let user = null;
		let personalData = self.param('user');


		try {
			let validationError=self.validateRegisterForm(personalData);
			if (validationError!=='') {
				throw new ApiError(error, 400);
			}
			user = self.database.sequelize.transaction(async (t) => {
				let sameMail = await self.database.User.findOne({
					where: {
						email: personalData.email
					},
					lock: true,
					transaction: t
				});
				if (sameMail) {
					throw new ApiError('User with this email already exists', 400);
				}

				let newUser = self.database.User.build();
				newUser.writeRemotes(personalData);
				await newUser.save({
					transaction: t,
					lock: true
				});
				return newUser;

			});
		} catch (e) {
			error=e;
		}

		if (!error) {
			self.render({
				user: user
			}, {
				statusCode: 201
			})
		} else {
			self.handleError(error);
		}

	}
}

module.exports = ApiUsersController;