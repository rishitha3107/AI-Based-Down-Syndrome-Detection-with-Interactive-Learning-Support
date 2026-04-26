const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

name: {
type: String,
required: true,
trim: true
},

email: {
type: String,
required: true,
unique: true,
match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
},

gender: {
type: String,
enum: ["Male","Female","Other",""],
default: ""
},

age: {
type: Number,
min: 1,
max: 120
},

phone: {
type: String,
default: ""
},

location: {
type: String,
default: ""
},

password: {
type: String,
required: true
}

}, { timestamps: true });


// Remove password from API responses

userSchema.methods.toJSON = function () {

const user = this.toObject();

delete user.password;

return user;

};

module.exports = mongoose.model("User", userSchema);