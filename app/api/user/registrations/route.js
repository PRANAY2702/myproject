import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model'; // Change to '@/models/Registration' if you use a separate file

export async function POST(req) {
    try {
        // 1. Verify the Firebase Token securely
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // 2. Connect to MongoDB 
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // 3. Parse the incoming data from the new frontend
        const body = await req.json();
        const { eventsData, city, type, groupMembers, totalPaid } = body;

        // 4. Save to Database
        // Using findOneAndUpdate with upsert: true ensures we update the existing user 
        // without accidentally wiping out their role or other data.
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: uid },
            {
                $set: {
                    type: type || 'single',
                    city: city || '',
                    groupMembers: groupMembers || [],
                    eventsData: eventsData || [],
                    totalPaid: totalPaid || 0,
                    paymentStatus: 'pending' // Starts pending so the Finance Admin can verify!
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: updatedUser }, { status: 201 });

    } catch (error) {
        console.error("Registration API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}