import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin';

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
    await requireRole(request, 'admin');

    const users = await User.find()
      .populate('eventsRegistered')
      .lean();

    return NextResponse.json(users, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message === 'Forbidden' ? 403 : 500 });
  }
}
