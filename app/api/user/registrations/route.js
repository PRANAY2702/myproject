import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model';

export const dynamic = 'force-dynamic';

// GET: Fetches the registrations for the Profile Dashboard
export async function GET(request) {
    try {
        await dbConnect();
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];
        if (!token) return NextResponse.json([], { status: 200 });
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ firebaseUid: decodedToken.uid }).lean();

        // Hand back the array so Profile Page's map function works
        return NextResponse.json(user?.eventsRegistered || [], { status: 200 });
    } catch (error) {
        return NextResponse.json([], { status: 200 });
    }
}

// POST: Saves new registrations from the Registration Page
export async function POST(req) {
    try {
        await dbConnect();
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        const body = await req.json();
        const { eventsData, city, type, groupMembers, totalPaid } = body;

        // Map the incoming data to include a creation date for the UI
        const newRegistrations = (eventsData || []).map(event => ({
            ...event,
            createdAt: new Date(),
            paymentStatus: 'pending'
        }));

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            {
                $set: {
                    type: type || 'single',
                    city: city || '',
                    groupMembers: groupMembers || [],
                    totalPaid: totalPaid || 0,
                    paymentStatus: 'pending' 
                },
                // Add the new registrations to the existing array
                $push: { eventsRegistered: { $each: newRegistrations } }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: updatedUser }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}