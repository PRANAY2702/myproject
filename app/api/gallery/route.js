import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/submission.model";
import User from "@/models/user.model";

export async function GET() {
  try {
    await dbConnect();

    const submissions = await Submission.find()
      .populate("userId", "fullName avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = submissions.map((sub) => ({
      _id: sub._id,
      title: sub.title,
      category: sub.category,
      imageUrl: sub.imageUrl,
      likesCount: sub.likedBy?.length || 0,
      user: {
        _id: sub.userId?._id,
        fullName: sub.userId?.fullName,
        avatarUrl: sub.userId?.avatarUrl,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}