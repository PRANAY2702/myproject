
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/submission.model';
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

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    await requireRole(request, 'admin');
    const parameters = await params;
    await Submission.findByIdAndDelete(parameters.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}