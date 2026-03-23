import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model';
import EventRegistration from '@/models/eventreg.model';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        await dbConnect();
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find the Mongo user first to get their _id
        const mongoUser = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!mongoUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { eventsData, city, type, groupMembers, totalPaid } = body;

        // 1. Create separate documents for the Admin APPROVALS collection
        const registrationPromises = (eventsData || []).map(event => {
            return EventRegistration.create({
                userId: mongoUser._id,
                eventId: event.eventId,
                amountPaid: event.amountPaid,
                paymentStatus: 'pending',
                city: city
            });
        });
        const createdRegs = await Promise.all(registrationPromises);

        // 2. Sync that data into the User's embedded array for the Registry/Profile
        await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            {
                $set: {
                    type: type || 'single',
                    city: city || '',
                    groupMembers: groupMembers || [],
                    totalPaid: totalPaid || 0
                },
                // Add the newly created registration documents into the user array
                $push: { eventsRegistered: { $each: createdRegs } }
            }
        );

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];
        if (!token) return NextResponse.json([], { status: 200 });
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ firebaseUid: decodedToken.uid }).lean();

        // Safe return using optional chaining to prevent null errors
        return NextResponse.json(user?.eventsRegistered || [], { status: 200 });
    } catch (error) {
        return NextResponse.json([], { status: 200 });
    }
}
