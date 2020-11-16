const Controller = require('../mainController');
const ApiError = require('../../core/error');
const Passport = require('../../core/passport');
const {v4: uuidv4} = require('uuid');

class ApiRoomsController extends Controller {
	constructor(...args) {
		super(...args);
		const self = this;
		self.format = Controller.HTTP_FORMAT_JSON;
		self.before(['*'], function (next) {
			if (self.req.authorized === true) {
				next();
			} else {
				self.render(
					{error: "Reload the page and log in"},
					{statusCode: 401});
			}
		});
	}

	async actionNewRoom() {
		const self = this;
		let remoteData = self.param('room');

		if (self.req.authorized === false || !self.req.user) {
			self.handleError(new ApiError('You must be logged in', 401));
			return;
		}
		if (!remoteData) {
			self.handleError(new ApiError("Your data has not been sent. Please refresh the page and try again.", 400));
			return;
		}
		if (remoteData.participantsNumber !== 3 && remoteData.participantsNumber !== 10) {
			remoteData.participantsNumber = 10;
		}
		let roomData = {
			uuid: uuidv4(),
			startDateTime: Date.now(),
			moderatorId: self.req.user.id,
			numberOfUsers: remoteData.participantsNumber
		}
		let room = null;
		try {
			room = await self.database.sequelize.transaction(async t => {
				let newRoom = self.database.Room.build();
				newRoom.writeRemotes(roomData);
				await newRoom.save({
					transaction: t,
					lock: true
				});
				return newRoom;
			});

		} catch (e) {
			self.handleError(e);
			return;
		}
		self.render({
				room: room
			},
			{
				statusCode: 201
			})
	}
}

module.exports = ApiRoomsController;