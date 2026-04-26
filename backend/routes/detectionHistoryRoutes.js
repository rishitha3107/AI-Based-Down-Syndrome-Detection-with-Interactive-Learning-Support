const express = require("express");

const router = express.Router();

const {
    saveDetection,
    getUserHistory
} = require("../controllers/detectionHistoryController");


router.post("/save", saveDetection);

router.get("/", getUserHistory);


module.exports = router;