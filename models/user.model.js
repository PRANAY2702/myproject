const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: [true, 'Firebase UID is required'],
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    fullName: {
        type: String,
        // required: [true, 'Full name is required'],
        trim: true,
        maxLength: [100, 'Name cannot exceed 100 characters'],
    },
    registrationCode: {
        type: String,
        unique: true,
        index: true,
        uppercase: true,
        trim: true,
        required: [true, 'Registration code is required'],
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    profession: {
        type: String,
        trim: true,
        maxLength: [100, 'Profession cannot exceed 100 characters'],
    },
    dob: {
        type: String,
    },
    spectrumAlum: {
        type: Boolean,
        default: false,
    },
    avatarUrl: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        maxLength: [500, 'Bio cannot exceed 500 characters'],
        trim: true,
    },
    role: {
        type: String,
        enum: ['participant', 'registration', 'admin', 'finance'],
        default: 'participant',
    },
    collegeDetails: {
        institutionName: {
            type: String,
            trim: true,
        },
        studentId: {
            type: String,
            trim: true,
        }
    },
    socialLinks: {
        instagram: { type: String, trim: true },
        portfolioWebsite: { type: String, trim: true },
    },
    eventsRegistered: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventRegistration',
    }],
    likedSubmissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
    }],
}, {
    timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;