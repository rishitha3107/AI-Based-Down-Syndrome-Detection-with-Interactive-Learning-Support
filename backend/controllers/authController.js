const User = require("../models/User");
const bcrypt = require("bcryptjs");


// ================= REGISTER USER =================

exports.registerUser = async (req, res) => {

try {

const {
name,
email,
gender,
age,
phone,
location,
password
} = req.body;


// Validate required fields

if(!name || !email || !password){

return res.status(400).json({
message: "Name, email and password are required"
});

}


// Check existing user

const existingUser = await User.findOne({ email });

if(existingUser){

return res.status(400).json({
message:"User already exists"
});

}


// Hash password

const hashedPassword =
await bcrypt.hash(password, 10);


// Save user

const user = new User({

name,
email,
gender,
age,
phone,
location,
password: hashedPassword

});

await user.save();


res.status(201).json({
message:"Registration successful"
});

}
catch(error){

res.status(500).json({
message:"Server error"
});

}

};



// ================= LOGIN USER =================

exports.loginUser = async (req, res) => {

try {

const { email, password } = req.body;

const user = await User.findOne({ email });

if(!user){

return res.status(401).json({
message:"Invalid credentials"
});

}


const isMatch =
await bcrypt.compare(password, user.password);

if(!isMatch){

return res.status(401).json({
message:"Invalid credentials"
});

}


// Send safe user data

res.status(200).json({

message:"Login successful",

user: {

name: user.name,
email: user.email,
gender: user.gender,
age: user.age,
phone: user.phone,
location: user.location

}

});

}
catch(error){

res.status(500).json({
message:"Server error"
});

}

};



// ================= UPDATE PROFILE =================

exports.updateProfile = async (req, res) => {

try {

const {
email,
name,
gender,
age,
phone,
location
} = req.body;


const updatedUser = await User.findOneAndUpdate(

{ email },

{
name,
gender,
age,
phone,
location
},

{ new: true }

);


if(!updatedUser){

return res.status(404).json({
message: "User not found"
});

}


res.status(200).json({

message: "Profile updated successfully",
user: updatedUser

});

}
catch(error){

res.status(500).json({
message:"Server error"
});

}

};