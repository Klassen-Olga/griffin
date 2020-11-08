module.exports = class SocketHelper {
	constructor(database) {
		const self = this;
		self.database = database;
	}

	async findRoom(uuid) {
		const self = this;
		let error = null;
		let a = null;
		try {
			a = await self.database.Room.findOne({
				where: {
					uuid: uuid
				}
			});
		} catch (e) {
			error = e;
		}
		if (!error) {
			return a;
		} else {
			return error;
		}
	}

	async proceedRequestForModerator(fullName, uuid, socket, dbId) {
		const self = this;
		let error = null;

		//find room user wants in
		let dbRoom = await self.findRoom(uuid);

		if (dbRoom instanceof Error) {
			socket.emit('onEnterNotification', dbRoom);
			return;
		}

		//is this user moderator- create participant and participantInRoom, emit moderator enter
		if (dbId && parseInt(dbId) === dbRoom.moderatorId) {
			error = await self.insertInBothTables(fullName, socket, dbRoom, dbId);
			socket.emit('onEnterNotification', error);
			return;
		}
		//check if moderator has participant table (is already in room)
		let participants = await self.getParticipant_Moderator(dbRoom);

		if (participants instanceof Error) {
			socket.emit('onEnterNotification', participants);
			return;
		}

		if (participants.length !== 0) {
			socket.emit('waitModeratorResponse');
			socket.to(participants[0].socketId).emit('requestForModerator', socket.id, fullName);

		} else {
			error = 'No moderator present, please reenter later';
			socket.emit('onEnterNotification', error);

		}

	}

	async insertInBothTables(fullName, socket, dbRoom, userId = null) {
		const self = this;

		try {
			await self.database.sequelize.transaction(async (t) => {
				let personalData = {
					fullName: fullName,
					socketId: socket.id,
					userId: userId
				}
				let newParticipant = self.database.Participant.build();
				newParticipant.writeRemotes(personalData);
				await newParticipant.save({
					transaction: t,
					lock: true
				});
				let personalData1 = {
					participantId: newParticipant.id,
					roomId: dbRoom.id
				}
				let newParticipantInRoom = self.database.ParticipantInRoom.build();
				newParticipantInRoom.writeRemotes(personalData1);
				await newParticipantInRoom.save({
					transaction: t,
					lock: true
				})
			})
		} catch (e) {
			return e.message;
		}
	}

	async getParticipant_Moderator(dbRoom) {
		const self = this;
		let participants = null;
		//findAll case if moderator entered many times, or closed and entered second time
		//in this case we will send to last createdAt participant
		try {
			participants = await self.database.Participant.findAll({
				where: {
					userId: dbRoom.moderatorId
				},
				include: [{
					model: self.database.ParticipantInRoom, as: 'allParticipants',
					where: {
						roomId: dbRoom.id
					}
				}],
				order: [
					['createdAt', 'DESC']
				]
			});

		} catch (e) {
			return e;
		}
		return participants;

	}

	async findParticipant(socketId) {
		const self = this;
		let error = null;
		let a = null;
		try {
			a = await self.database.Participant.findOne({
				where: {
					socketId: socketId
				}
			});
		} catch (e) {
			error = e;
		}
		if (!error) {
			return a;
		} else {
			return error;
		}
	}

	async insertMessage(text, uuid, fromSocketId, toSocketId) {
		const self = this;
		try {
			let dbRoom = await self.findRoom(uuid);
			let fromParticipant = await self.findParticipant(fromSocketId);
			let toParticipant = null;
			if (toSocketId) {
				toParticipant = await self.findParticipant(toSocketId);
			}
			await self.database.sequelize.transaction(async (t) => {
				let message = {
					text: text,
					fromId: fromParticipant.id,
					toId: toParticipant ? toParticipant.id : null,
					roomId: dbRoom.id
				}
				let newMessage = self.database.Message.build();
				newMessage.writeRemotes(message);
				await newMessage.save({
					transaction: t,
					lock: true
				});
			})
		} catch (e) {
			return e;
		}
	}
}