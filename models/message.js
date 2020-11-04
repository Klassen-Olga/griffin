const Passport=require('../core/passport');
module.exports=function (Model, database) {

	Model.prototype.writeRemotes=function (remoteData) {
		const self=this;
		if (typeof remoteData.text !== 'undefined') {
			self.text = remoteData.text;
		}

		if (typeof remoteData.fromId !== 'undefined') {
			self.fromId = remoteData.fromId;
		}

		if (typeof remoteData.toId !== 'undefined') {
			self.toId = remoteData.toId;
		}
		if (typeof remoteData.roomId !== 'undefined') {
			self.roomId = remoteData.roomId;
		}

	}
}