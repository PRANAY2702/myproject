import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // Your existing core fields
    firebaseUid: { type: String, required: true, unique: true },
    phone: { type: String },
    email: { type: String },
    role: { type: String, default: 'participant' }, // 'admin', 'finance', etc.

    // --- NEW SPECTRUM REGISTRATION FIELDS ---
    type: { 
        type: String, 
        enum: ['single', 'group5', 'group10'], 
        default: 'single' 
    },
    city: { type: String, default: '' },
    groupMembers: [{
        name: { type: String },
        phone: { type: String },
        college: { type: String }
    }],
    eventsData: [{
        eventId: { type: String },
        amountPaid: { type: Number }
    }],
    totalPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'pending' }

}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);