import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model'; // Change to '@/models/Registration' if you use a separate file
export const dynamic = 'force-dynamic';
export async function POST(req) {
    try {
        await dbConnect();
        
        // 1. Verify the user securely
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 2. Find the user in the database
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. THE FIX: Return the eventsData array exactly as it appears in your screenshot
        // If they haven't registered, it gracefully returns an empty array []
        return NextResponse.json(user.eventsData || [], { status: 200 });

    } catch (error) {
        console.error("Registrations GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}
