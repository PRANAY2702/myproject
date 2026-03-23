
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

export async function GET(request) {
  try {
    await dbConnect();
    await requireRole(request, 'admin');

    const subs = await Submission.find({})
      .populate('userId', 'fullName avatarUrl registrationCode')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(subs, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}