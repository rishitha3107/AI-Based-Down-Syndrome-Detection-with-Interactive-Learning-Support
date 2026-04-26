const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());


// AUTH ROUTES
app.use(
"/api/auth",
require("./routes/authRoutes")
);


// ⭐ ADD THIS LINE
app.use(
"/api/history",
require("./routes/detectionHistoryRoutes")
);


app.get("/", (req,res)=>{

res.send("DownCare API Running");

});


const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{

console.log(
`Server running on port ${PORT}`
);

});