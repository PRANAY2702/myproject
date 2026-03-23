import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // Core Auth Fields
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, default: 'participant' },

    // Profile Fields
    fullName: { type: String },
    phone: { type: String },
    profession: { type: String },
    dob: { type: String },
    spectrumAlum: { type: Boolean, default: false },
    avatarUrl: { type: String },
    collegeDetails: {
        institutionName: { type: String }
    },
    registrationCode: { type: String },

    // Registration Fields
    type: { type: String, enum: ['single', 'group5', 'group10'], default: 'single' },
    city: { type: String, default: '' },
    groupMembers: [{
        name: { type: String },
        phone: { type: String },
        college: { type: String }
    }],
    
    // RENAMED from eventsData to eventsRegistered to match Admin Panel
    eventsRegistered: [{
        eventId: { type: String },
        amountPaid: { type: Number },
        paymentStatus: { type: String, default: 'pending' },
        dayOneAttendance: { type: Boolean, default: false },
        dayTwoAttendance: { type: Boolean, default: false },
        dayTwoAccess: { type: Boolean, default: false },
    }],

    totalPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'pending' }

}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
