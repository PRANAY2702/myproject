import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import User from '@/models/user.model';
// THIS WAS THE MISSING LINE:
import dbConnect from '@/lib/mongodb'; 

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // 1. Connect to the database
        await dbConnect();

        // 2. Verify the Firebase Token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 3. Find the user in the "users" collection (as seen in your screenshot)
        // We use .lean() to get a plain Javascript object back
        const user = await User.findOne({ firebaseUid: decodedToken.uid }).lean();

        if (!user) {
            return NextResponse.json([], { status: 200 });
        }

        // 4. Return the eventsData array
        return NextResponse.json(user.eventsData || [], { status: 200 });

    } catch (error) {
        console.error("Registrations GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
