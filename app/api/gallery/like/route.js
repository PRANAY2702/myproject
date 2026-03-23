import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/submission.model";
import User from "@/models/user.model";
import admin from "@/lib/firebaseAdmin";

async function verifyAuth(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    const token = authHeader.split("Bearer ")[1];
    return await admin.auth().verifyIdToken(token);
}

export async function POST(req) {
    try {
        await dbConnect();
        const decoded = await verifyAuth(req);

        const user = await User.findOne({ firebaseUid: decoded.uid });
        if (!user) throw new Error("User not found");

        const { submissionId } = await req.json();

        const submission = await Submission.findById(submissionId);
        if (!submission) throw new Error("Submission not found");

        const alreadyLiked = submission.likedBy.includes(user._id);

        if (alreadyLiked) {
            submission.likedBy.pull(user._id);
        } else {
            submission.likedBy.push(user._id);
        }

        await submission.save();

        return NextResponse.json({
            liked: !alreadyLiked,
            likesCount: submission.likedBy.length,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}