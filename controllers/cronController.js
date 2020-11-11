const CronJob = require('cron').CronJob;
module.exports = class CronController {

	constructor(database, socketHelper) {
		const self = this;
		self.database = database;
		self.socketHelper = socketHelper;

		self.roomsToRemove = {};
	}

	setCronJobRemoveRoom(uuid) {
		const self = this;

		let timeStamp = Date.now();
		let now = new Date(timeStamp);
		now.setMinutes(now.getMinutes() + config.cronRemoveRoomAfter);

		let cronTime = now.getMinutes() + ' ' + now.getHours() + ' * * *';

		let job = new CronJob(cronTime, async function () {
			await self.removeAllRoomData(uuid);
		}, null, true, config.cronTimeZone);
		if (job instanceof Error) {
			return job;
		}
		self.roomsToRemove[uuid] = {
			when: now,
			job: job
		};

		job.start();
	}

	destroyCronJobRemoveRoom(uuid) {
		const self = this;
		let room=self.roomsToRemove[uuid];
		if (room) {
			room.job.stop();
			room.job = null;

			delete self.roomsToRemove[uuid];
		}
	}

	async removeAllRoomData(uuid) {
		const self = this;
		try {
			await self.database.sequelize.transaction(async (t) => {
				let roomDb = await self.socketHelper.findRoom(uuid);
				if (roomDb instanceof Error) {
					console.error("Can not execute cron job, uuid " + uuid + " doesn't exist in database")
					return;
				}
				let messages = await self.database.Message.findAll({
					where: {
						roomId: roomDb.id
					}
				});
				let participantsInRoom = await self.database.ParticipantInRoom.findAll({
					where: {
						roomId: roomDb.id
					}
				});
				let participants = [];

				for (const participantInRoom of participantsInRoom) {
					let dbParticipant = await self.database.Participant.findOne({
						where: {
							id: participantInRoom.participantId
						}
					});
					participants.push(dbParticipant);
				}
				for (let index in messages) {
					await messages[index].destroy();
				}
				for (let index in participantsInRoom) {
					await participantsInRoom[index].destroy();
				}
				for (let index in participants) {
					await participants[index].destroy()
				}
				await roomDb.destroy();
				self.destroyCronJobRemoveRoom(uuid);
			})
		} catch (e) {
			console.error(e.message);
			return e;
		}

	}
}
