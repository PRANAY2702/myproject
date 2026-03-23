// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300,
    }
});

const Otp = mongoose.model('Otp', otpSchema) || mongoose.models.Otp;
module.exports = Otp;