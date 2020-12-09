const Controller = require('../mainController');
const ApiError = require('../../core/error');
const Passport=require('../../core/passport');

class ApiUsersController extends Controller {
	constructor(...args) {
		super(...args);
		const self = this;
		self.format = Controller.HTTP_FORMAT_JSON;
		self.before(['*', '-register', '-login'], function (next) {
			if (self.req.authorized === true) {
				next();
			} else {
				self.render(
					{error: "Reload the page and log in"},
					{statusCode: 401});
			}
		});
	}

	undefinedCheck(data) {
		if (!data){
			return false;
		}
		for (let i in data) {
			if (typeof data[i] === 'undefined') {
				return false;
			}
		}
		return true;
	}

	validateRegisterForm(user) {
		const self = this;
		let error = '';
		if (self.undefinedCheck(user) === false) {
			error = "Reload the page";
		}
		self.undefinedCheck(user);
		if (user.firstName.length < 2) {
			error = "First name should be at least 2 characters long";
		}
		if (user.lastName.length < 2) {
			error = "Last name should be at least 2 characters long";
		}
		const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (re.test(user.email.toLowerCase()) === false) {
			error = "The email is in the wrong format";

		}
		if (user.password !== user.repeatPassword) {
			error = "Password and repeat password should match";

		}

		const rePass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
		if (rePass.test(user.password) === false) {
			error = "Your password should contain at least one character and one number and should be at least 8 characters long";
		}
		return error;
	}



	async insertIfNotExist(personalData, transaction) {
		const self = this;
		let sameUser = await self.database.User.findOne({
			where: {
				email: personalData.email
			},
			transaction: transaction
		});


		if (sameUser) {
			throw new ApiError('User with this email already exists', 400);

		}

		let newUser = self.database.User.build();

		self.database.User.prototype.writeRemotes=function (remoteData) {
			const self = this;
			for (let i in remoteData) {
				self[i] = remoteData[i];
			}
		}
		newUser.writeRemotes(personalData);
		await newUser.save({
			transaction: transaction,
			lock: true
		});
		return newUser;
	}

	async actionRegister() {
		const self = this;
		let error = '';
		let user = null;
		let personalData = self.param('user');


		try {

			let validationError = self.validateRegisterForm(personalData);
			if (validationError !== '') {
				throw new ApiError(validationError, 400);
			}
			user = await self.database.sequelize.transaction(async (t) => {

				let newUser = self.insertIfNotExist(personalData, t);
				return newUser;
			});
		} catch (e) {
			console.log(e.message);
			error = e;
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
	async actionLogin(){
		const self=this;
		let error='';
		let user=null;
		let personalData = self.param('user');
		try {

			user = await self.database.sequelize.transaction(async (t) => {
				let dbUser = await self.database.User.findOne({
					where: {
						email: personalData.email
					},
					transaction: t
				});
				if (!dbUser){
					throw new ApiError('User with this email does not exist', 404);
				}
				if (Passport.comparePassword(personalData.password, dbUser.passwordHash)===false){
					throw new ApiError('Email or password is incorrect', 401);
				}
				return dbUser;
			});
		} catch (e) {
			console.log(e.message);
			error = e;
		}


		if (error) {
			self.handleError(error);
		}
		else{
			let token = Passport.authorizeUserWithCookie(self.req, self.res, user.id);
			self.render({
				token: token
			}, {
				statusCode: 200
			});
		}

	}
	actionLogout(){
		const self=this;
		Passport.unauthorizeUser(self.req, self.res);
		self.render();
	}
}

module.exports = ApiUsersController;