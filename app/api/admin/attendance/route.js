
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

export async function PATCH(request) {
  try {
    await dbConnect();
    await requireRole(request, 'admin', 'registration');

    const { registrationCode, day } = await request.json();

    // 1. Find the user by their unique code
    const user = await User.findOne({ registrationCode })
      .populate('eventsRegistered')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });
    }

    // 2. Must have at least one verified registration
    const hasVerified = user.eventsRegistered.some(r => r.paymentStatus === 'verified');
    if (!hasVerified) {
      return NextResponse.json({ error: `${user.fullName} has no verified payments!` }, { status: 403 });
    }

    // 3. Day 2 requires dayTwoAccess
    if (day === 2) {
      const hasDay2Access = user.eventsRegistered.some(r => r.dayTwoAccess);
      if (!hasDay2Access) {
        return NextResponse.json({ error: `${user.fullName} is NOT authorized for Day 2.` }, { status: 403 });
      }
    }

    // 4. Check if already marked
    const attendanceField = day === 1 ? 'dayOneAttendance' : 'dayTwoAttendance';
    const alreadyPresent = user.eventsRegistered.some(r => r[attendanceField]);
    if (alreadyPresent) {
      return NextResponse.json({ fullName: user.fullName, alreadyPresent: true }, { status: 200 });
    }

    // 5. Mark attendance on ALL their registrations (or just verified ones — your call)
    await EventRegistration.updateMany(
      { userId: user._id },
      { $set: { [attendanceField]: true } }
    );

    return NextResponse.json({ fullName: user.fullName, alreadyPresent: false }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}