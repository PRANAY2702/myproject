import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

async function requireRole(request, ...roles) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = await admin.auth().verifyIdToken(token);
  const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
  if (!user || !roles.includes(user.role)) throw new Error('Forbidden');
  return user;
}

export async function GET(request) {
  try {
    await dbConnect();
    // Verify requester is an admin
    await requireRole(request, 'admin');

    // Fetch users. We no longer use .populate() because eventsRegistered 
    // is an embedded array within the User document.
    const users = await User.find().lean();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json(
        { error: error.message }, 
        { status: error.message === 'Forbidden' ? 403 : 500 }
    );
  }
}
