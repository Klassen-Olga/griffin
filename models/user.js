const Passport=require('../core/passport');
module.exports=function (Model, database) {
	Model.prototype.fullName=function(){
		return this.firstName+' '+this.lastName;
	}
	Model.prototype.writeRemotes=function (remoteData) {
		const self=this;

		if(typeof remoteData.firstName!='undefined'){
			self.firstName=remoteData.firstName;
		}
		if(typeof remoteData.lastName!='undefined'){
			self.lastName=remoteData.lastName;
		}
		if(typeof remoteData.email!='undefined'){
			self.email=remoteData.email;
		}
		if(typeof remoteData.password!='undefined'){
			self.passwordHash=Passport.hashPassword(remoteData.password);
		}
	}
}