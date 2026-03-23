import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventRegistration from '@/models/eventreg.model';
import User from '@/models/user.model';
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
    await requireRole(request, 'admin', 'finance');
    const { paymentStatus } = await request.json();
    const { id } = await params;

    // 1. Update the main registration record
    const reg = await EventRegistration.findByIdAndUpdate(id, { paymentStatus }, { new: true });

    // 2. Sync the status back to the User's embedded array
    await User.updateOne(
      { _id: reg.userId, "eventsRegistered._id": id },
      { $set: { "eventsRegistered.$.paymentStatus": paymentStatus } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
