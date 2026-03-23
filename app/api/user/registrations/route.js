import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model';

export async function POST(req) {
    try {
        await dbConnect();
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const body = await req.json();
        const { eventsData, city, type, groupMembers, totalPaid } = body;

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: uid },
            {
                $set: {
                    type: type || 'single',
                    city: city || '',
                    groupMembers: groupMembers || [],
                    // Save to the renamed field
                    eventsRegistered: eventsData || [], 
                    totalPaid: totalPaid || 0,
                    paymentStatus: 'pending'
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: updatedUser }, { status: 201 });
    } catch (error) {
        console.error("Registration POST Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
