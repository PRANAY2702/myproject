import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/submission.model';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin';

// ----------------------------
// VERIFY FIREBASE TOKEN
// ----------------------------
async function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split('Bearer ')[1];
  return await admin.auth().verifyIdToken(token);
}

// ----------------------------
// CREATE SUBMISSION
// ----------------------------
export async function POST(req) {
  try {
    await dbConnect();
    const decodedToken = await verifyAuth(req);

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, imageUrl, description } = body;

    // Validate required fields
    if (!title || !category || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Limit to max 4 submissions
    const existingCount = await Submission.countDocuments({
      userId: user._id,
    });

    if (existingCount >= 4) {
      return NextResponse.json(
        { error: "Maximum submission limit reached" },
        { status: 400 }
      );
    }

    const newSubmission = await Submission.create({
      userId: user._id,
      title,
      category, // must be 'art' or 'photography'
      imageUrl,  // ✅ CORRECT FIELD
      description: description || "",
    });

    return NextResponse.json(newSubmission, { status: 201 });

  } catch (error) {
    console.error("Submission Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ----------------------------
// GET USER SUBMISSIONS
// ----------------------------
export async function GET(req) {
  try {
    await dbConnect();
    const decodedToken = await verifyAuth(req);

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const submissions = await Submission.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json(submissions, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}