module.exports=function (Model, database) {

	Model.prototype.writeRemotes=function (remoteData) {
		const self=this;
		for (let i in remoteData){
			self[i]=remoteData[i];
		}
	}
}