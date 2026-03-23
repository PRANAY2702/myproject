const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A submission must be linked to a User'],
        index: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventRegistration', // Optional: Link to their specific registration
    },
    title: {
        type: String,
        required: [true, 'Artwork title is required'],
        trim: true,
        maxLength: [150, 'Title is too long'],
    },
    category: {
        type: String,
        enum: ['art', 'photography'],
        required: [true, 'Category must be either art or photography'],
        index: true,
    },
    description: {
        type: String,
        trim: true,
        maxLength: [1000, 'Description cannot exceed 1000 characters'],
    },
    imageUrl: {
        type: String,
        required: true
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

// delete the model if cached
mongoose.models.Submission && delete mongoose.models.Submission;

const Submission = mongoose.model('Submission', submissionSchema) || mongoose.models.Submission;
module.exports = Submission;