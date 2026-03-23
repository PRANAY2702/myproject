const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    eventId: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending',
    },
    // ADDED: To store the Firebase Storage URL
    paymentScreenshotUrl: {
        type: String,
        // required: true,
    },
    city: {
        type: String, 
    },
    dayOneAttendance: {
        type: Boolean,
        default: false,
    },
    dayTwoAttendance: {
        type: Boolean,
        default: false,
    },
    dayTwoAccess: {
        type: Boolean,
        default: false,
    },
    requiresAccommodation: {
        type: Boolean,
        default: false,
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    couponCode: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// Remove the delete block and use this single line:
const EventRegistration = mongoose.models.EventRegistration || mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = EventRegistration;