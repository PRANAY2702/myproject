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
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const mongoUser = await User.findOne({ firebaseUid: decodedToken.uid });

        const { eventsData, city, type, groupMembers, totalPaid } = await req.json();

        // 1. Create separate entries in EventRegistration for the Admin APPROVALS tab
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

        // 2. Update the User document for the REGISTRY tab and Profile page
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
                // Store the IDs of the new registrations in the user document
                $push: { eventsRegistered: { $each: createdRegs } }
            },
            { new: true }
        );

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
