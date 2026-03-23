import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // Core Auth Fields
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, default: 'participant' },

    // Profile Fields (These fix the infinite loop)
    fullName: { type: String },
    phone: { type: String },
    profession: { type: String },
    dob: { type: String },
    spectrumAlum: { type: Boolean, default: false },
    avatarUrl: { type: String },
    collegeDetails: {
        institutionName: { type: String }
    },

    // Registration Fields (From our earlier fixes)
    type: { type: String, enum: ['single', 'group5', 'group10'], default: 'single' },
    city: { type: String, default: '' },
    groupMembers: [{
        name: { type: String },
        phone: { type: String },
        college: { type: String }
    }],
   // models/user.model.js
import mongoose from 'mongoose';
    eventsRegistered: [{
        eventId: { type: String },
        amountPaid: { type: Number },
        paymentStatus: { type: String, default: 'pending' },
        requiresAccommodation: { type: Boolean, default: false },
        dayOneAttendance: { type: Boolean, default: false },
        dayTwoAttendance: { type: Boolean, default: false },
        dayTwoAccess: { type: Boolean, default: false },
    }],

    // Keep eventsData temporarily as an empty array to prevent 
    // the registration page from crashing until you update its POST route.
    eventsData: { type: Array, default: [] } 

}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);

export default mongoose.models.User || mongoose.model('User', UserSchema);
