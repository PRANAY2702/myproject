import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';
import EventRegistration from '@/models/eventreg.model';
import admin from '@/lib/firebaseAdmin';

async function requireRole(request, ...roles) {
  const token = (request.headers.get('authorization') || '').split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = await admin.auth().verifyIdToken(token);
  const caller = await User.findOne({ firebaseUid: decoded.uid }).lean();
  if (!caller || !roles.includes(caller.role)) throw new Error('Forbidden');
  return caller;
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    await requireRole(request, 'admin');
    const { isSelectedDay2 } = await request.json();

    const parameters = await params;

    // Update dayTwoAccess on every EventRegistration belonging to this user
    await EventRegistration.updateMany(
      { userId: parameters.id },
      { $set: { dayTwoAccess: isSelectedDay2 } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}