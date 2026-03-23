import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model';
import EventRegistration from '@/models/eventreg.model'; // CRITICAL IMPORT

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        await dbConnect();
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find the Mongo user ID
        const mongoUser = await User.findOne({ firebaseUid: decodedToken.uid });

        const body = await req.json();
        const { eventsData, city, type, groupMembers, totalPaid } = body;

        // 1. Create documents in the separate EventRegistration collection for the APPROVALS tab
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

        // 2. Update the User document array for the REGISTRY tab and Profile page
        // Note: We use the IDs from the documents we just created
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
                $push: { eventsRegistered: { $each: createdRegs } }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: updatedUser }, { status: 201 });
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
        return NextResponse.json(user?.eventsRegistered || [], { status: 200 });
    } catch (error) {
        return NextResponse.json([], { status: 200 });
    }
}
