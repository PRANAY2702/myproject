import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin';
import EventRegistration from '@/models/eventreg.model';

export async function GET(request) {
    try {
        await dbConnect();

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        const user = await User.findOne({ firebaseUid: decodedToken.uid })
            .populate('eventsRegistered')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error) {
        console.error('GET /api/user error:', error);
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}