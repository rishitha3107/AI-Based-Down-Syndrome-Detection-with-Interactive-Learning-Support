const DetectionHistory = require("../models/detectionHistoryModel");


// SAVE DETECTION HISTORY (WITH IMAGES)

const saveDetection = async (req, res) => {

    try {

        const {
            prediction,
            confidence,
            originalImage,
            gradcamImage
        } = req.body;

        console.log("Saving history with images...");

        const history = await DetectionHistory.create({

            userId: req.user ? req.user.id : null,

            prediction,
            confidence,
            originalImage,
            gradcamImage

        });

        res.status(201).json(history);

    }

    catch (error) {

        console.log("SAVE ERROR:", error);

        res.status(500).json({
            message: error.message
        });

    }

};


// GET HISTORY

const getUserHistory = async (req, res) => {

    try {

        const history = await DetectionHistory
        .find()
        .sort({ createdAt: -1 });

        res.json(history);

    }

    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};


// EXPORT BOTH FUNCTIONS

module.exports = {

    saveDetection,
    getUserHistory

};