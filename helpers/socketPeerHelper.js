module.exports=class PeerHelper{
	constructor(database) {
		const self=this;
		self.database=database;
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
			return e;
		}
	}
	async findRoom(uuid) {
		const self = this;
		let error=null;
		let a=null;
		try {
			a= await self.database.Room.findOne({
				where: {
					uuid: uuid
				}
			});
		} catch (e) {
			error= e;
		}
		if (!error){
			return a;
		}
		else{
			return error;
		}
	}
	async getParticipant_Moderator(dbRoom){
		const self=this;
		let participants=null;
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
	async proceedRequestForModeratorPeer(fullName, uuid, socket, dbId) {
		const self = this;
		let error = null;

		//check if number of users not more than specified in config
		if (socket.adapter.rooms[uuid] && socket.adapter.rooms[uuid].length === config.maxUsersNumberPeerConnection) {
			socket.emit('participantsNumberError', 'Maximum number of users in this chat is reached');
			return;
		}
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
}