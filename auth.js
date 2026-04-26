// ================= PASSWORD TOGGLE =================

function togglePassword(id) {

const field = document.getElementById(id);

field.type =
field.type === "password"
? "text"
: "password";

}



// ================= REGISTER FUNCTION =================

async function registerUser(event) {

event.preventDefault();

const name =
document.getElementById("regName").value;

const email =
document.getElementById("regEmail").value;

const gender =
document.getElementById("regGender").value;

const age =
document.getElementById("regAge").value;

const phone =
document.getElementById("regPhone").value;

const location =
document.getElementById("regLocation").value;

const password =
document.getElementById("regPassword").value;

const confirmPassword =
document.getElementById("confirmPassword").value;


// PASSWORD MATCH CHECK

if(password !== confirmPassword){

alert("Passwords do not match");

return;

}


try{

const response = await fetch(
"http://localhost:5000/api/auth/register",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name,
email,
gender,
age,
phone,
location,
password
})
}
);


const data = await response.json();


if(response.ok){

alert("Registration successful!");

window.location.href = "login.html";

}
else{

alert(data.message);

}

}
catch(error){

alert("Server error. Try again later.");

}

}



// ================= LOGIN FUNCTION =================

async function loginUser(event){

event.preventDefault();

const email =
document.getElementById("loginEmail").value;

const password =
document.getElementById("loginPassword").value;


try{

const response = await fetch(
"http://localhost:5000/api/auth/login",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
password
})
}
);


const data = await response.json();


if(response.ok){

// STORE USER SESSION

localStorage.setItem(
"user",
JSON.stringify(data.user)
);


// REDIRECT TO DASHBOARD

window.location.href = "index.html";

}
else{

alert(data.message);

}

}
catch(error){

alert("Server error. Try again later.");

}

}