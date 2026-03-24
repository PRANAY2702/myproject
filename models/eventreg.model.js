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
    paymentScreenshotUrl: {
        type: String,
    },
    city: {
        type: String, 
    },
    // --- NEW FIELDS FOR GROUP REGISTRATIONS ---
    registrationType: {
        type: String,
        default: 'single', // 'single', 'group5', 'group10'
    },
    participants: [{
        fullName: String,
        phone: String,
        college: String
    }],
    // ------------------------------------------
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

const EventRegistration = mongoose.models.EventRegistration || mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = EventRegistration;