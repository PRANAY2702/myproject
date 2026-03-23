
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

export async function GET(request) {
  try {
    await dbConnect();
    await requireRole(request, 'admin', 'finance');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query = status ? { paymentStatus: status } : {};
    const regs = await EventRegistration.find(query)
      .populate('userId', 'fullName registrationCode')
      .lean();

    // FILTER OUT NULL USERS: This stops the "reading _id of null" crash on the Approvals tab
    const validRegistrations = regs.filter(reg => reg.userId !== null);

    return NextResponse.json(validRegistrations, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
