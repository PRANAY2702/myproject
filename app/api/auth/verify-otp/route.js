import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/otp.model';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin'; // You'll need to initialize the Admin SDK here

export async function POST(request) {
  try {
    await dbConnect();

    const { email, otp } = await request.json();

    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    await Otp.deleteOne({ _id: record._id });

    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        firebaseUser = await admin.auth().createUser({
          email: email,
          emailVerified: true,
        });
      } else {
        throw error;
      }
    }

    // 6. Sync with your local MongoDB User collection
    await User.findOneAndUpdate(
      { email: email },
      {
        firebaseUid: firebaseUser.uid,
        $setOnInsert: { email: email }
      },
      { upsert: true }
    );

    // 7. Generate Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    // 8. Return token to the frontend
    return NextResponse.json({ firebaseToken: customToken }, { status: 200 });

  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}