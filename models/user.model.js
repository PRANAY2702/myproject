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

    // The primary field used by Admin Panel and Dashboard
    eventsRegistered: [{
        eventId: { type: String },
        amountPaid: { type: Number },
        paymentStatus: { type: String, default: 'pending' },
        dayOneAttendance: { type: Boolean, default: false },
        dayTwoAttendance: { type: Boolean, default: false },
        dayTwoAccess: { type: Boolean, default: false },
    }],

    // Keeping eventsData as a ghost field to prevent legacy crashes
    eventsData: { type: Array, default: [] }, 
    
    type: { type: String, enum: ['single', 'group5', 'group10'], default: 'single' },
    city: { type: String, default: '' },
    groupMembers: [{
        name: { type: String },
        phone: { type: String },
        college: { type: String }
    }],
    totalPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'pending' }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
