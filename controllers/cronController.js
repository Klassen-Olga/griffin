const CronJob = require('cron').CronJob;
let SocketHelper=require('../helpers/socketHelper');
module.exports= class CronController{

	constructor(database) {
		const self=this;
		self.database=database;
		self.socketHelper=new SocketHelper(self.database);
	}
	async removeAllRoomData(uuid){
		const self=this;
		try {
			await self.database.sequelize.transaction(async (t) => {
				let roomDb=await self.socketHelper.findRoom(uuid);
				if (roomDb instanceof Error){
					console.error("Can not execute cron job, uuid "+ uuid+" doesn't exist in database")
					return;
				}
				let messages= await self.database.Message.findAll({
					where:{
						roomId:roomDb.id
					}
				});
				let participantsInRoom= await self.database.ParticipantInRoom.findAll({
					where:{
						roomId:roomDb.id
					}
				});
				let participants=[];

				for (const participantInRoom of participantsInRoom) {
					let dbParticipant = await self.database.Participant.findOne({
						where:{
							id:participantInRoom.participantId
						}
					});
					participants.push(dbParticipant);
				}
				for (let index in messages){
					await messages[index].destroy();
				}
				for (let index in participantsInRoom){
					await participantsInRoom[index].destroy();
				}
				for (let index in participants){
					await participants[index].destroy()
				}
				await roomDb.destroy();
			})
		} catch (e) {
			console.error(e);
			return e;
		}

	}
	newCronJob(callback){
		let job = new CronJob('* * * * * *', function () {
			callback();
		}, null, true, config.cronTimeZone);
		job.start();
	}

}
/*
let CronJob= require('./controllers/cronController');
let newCronJob= new CronJob();
function hello(){
	console.log('Hello');
}
newCronJob.newCronJob(hello);*/
