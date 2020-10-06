let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userSchema= new Schema({
	firstName:{type:String, minLength:2},
	lastName:{type:String, minLength:2},
	email:{type:String, minLength:5},
	passwordHash: String,
}, {timestamps:true});

module.exports = mongoose.model("User", userSchema);