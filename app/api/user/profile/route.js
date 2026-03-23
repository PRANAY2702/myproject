import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model'; // Ensure this path matches your project structure
import admin from '@/lib/firebaseAdmin';

// Helper function to verify the Firebase JWT token
async function verifyAuth(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
}

// ==========================================
// GET: Fetch the user's Mongoose profile
// Used by the UserProfile dashboard on load
// ==========================================
export async function GET(request) {
    try {
        await dbConnect();
        const decodedToken = await verifyAuth(request);

        // Find the Mongoose user using the verified Firebase UID
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return NextResponse.json({ error: 'User profile not found in database' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error) {
        console.error("Profile GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

// ==========================================
// PATCH: Update the user's Mongoose profile
// Used by CompleteProfileModal and Avatar Upload
// ==========================================
export async function PATCH(request) {
    try {
        await dbConnect();
        const decodedToken = await verifyAuth(request);
        const body = await request.json();

        // 1. Build the update object dynamically based on what the frontend sent
        // This allows the same route to handle the full form AND the single avatar update
        const updateData = {};

        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.spectrumAlum !== undefined) updateData.spectrumAlum = body.spectrumAlum;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (body.profession !== undefined) updateData.profession = body.profession;
        if (body.dob !== undefined) updateData.dob = body.dob;

        // Handle nested collegeDetails safely using MongoDB dot notation
        if (body.collegeDetails && body.collegeDetails.institutionName !== undefined) {
            updateData['collegeDetails.institutionName'] = body.collegeDetails.institutionName;
        }

        // 2. Find the user by firebaseUid and apply the updates
        // { new: true } returns the updated document
        // { runValidators: true } ensures Mongoose runs your regex checks (like the +91 phone check)
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            { $set: updateData },
            { new: true, runValidators: true, upsert: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found to update' }, { status: 404 });
        }

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error('Profile PATCH Error:', error);

        // Check if it's a Mongoose validation error (e.g., bad phone number)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

// ==========================================
// PATCH: Update the user's Mongoose profile
// Used by Edit Profile form in UserProfile page
// ==========================================

export async function PUT(request) {
    try {
        await dbConnect();
        const decodedToken = await verifyAuth(request);
        const body = await request.json();
        // Build the update object dynamically based on what the frontend sent
        const updateData = {};
        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.profession !== undefined) updateData.profession = body.profession;
        if (body.dob !== undefined) updateData.dob = body.dob;
        // Handle nested collegeDetails safely using MongoDB dot notation
        if (body.collegeDetails && body.collegeDetails.institutionName !== undefined) {
            updateData['collegeDetails.institutionName'] = body.collegeDetails.institutionName;
        }
        // Find the user by firebaseUid and apply the updates
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            { $set: updateData },
            { new: true, runValidators: true, upsert: true }
        );
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found to update' }, { status: 404 });
        }
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error('Profile PUT Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}