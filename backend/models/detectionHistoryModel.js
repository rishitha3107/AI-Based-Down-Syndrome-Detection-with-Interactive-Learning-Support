const mongoose = require("mongoose");

const detectionHistorySchema = new mongoose.Schema({

    prediction: {
        type: String,
        required: true
    },

    confidence: {
        type: Number,
        required: true
    },

    originalImage: {
        type: String
    },

    gradcamImage: {
        type: String
    }

}, { timestamps: true });

module.exports = mongoose.model(
    "DetectionHistory",
    detectionHistorySchema
);