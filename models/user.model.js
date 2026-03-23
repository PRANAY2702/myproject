import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, default: 'participant' },
    fullName: { type: String },
    phone: { type: String },
    profession: { type: String },
    dob: { type: String },
    avatarUrl: { type: String },
    registrationCode: { type: String },
    collegeDetails: { institutionName: { type: String } },

    // Primary field for Registry and Profile mapping
    // Defined as an array of subdocuments with a default empty array
    eventsRegistered: [{
        eventId: { type: String },
        amountPaid: { type: Number },
        paymentStatus: { type: String, default: 'pending' },
        dayOneAttendance: { type: Boolean, default: false },
        dayTwoAttendance: { type: Boolean, default: false },
        dayTwoAccess: { type: Boolean, default: false },
        requiresAccommodation: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],

    type: { type: String, enum: ['single', 'group5', 'group10'], default: 'single' },
    city: { type: String, default: '' },
    groupMembers: [{
        name: { type: String },
        phone: { type: String },
        college: { type: String }
    }],
    totalPaid: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
