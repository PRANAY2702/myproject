import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        await dbConnect();
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        const body = await req.json();
        const { eventsData, city, type, groupMembers, totalPaid } = body;

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            {
                $set: {
                    type: type || 'single',
                    city: city || '',
                    groupMembers: groupMembers || [],
                    eventsRegistered: eventsData || [], // SAVING TO THE CORRECT FIELD
                    totalPaid: totalPaid || 0,
                    paymentStatus: 'pending' 
                }
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

        // Hand back eventsRegistered so the Profile Page sees your tickets
        return NextResponse.json(user?.eventsRegistered || [], { status: 200 });
    } catch (error) {
        return NextResponse.json([], { status: 200 });
    }
}
