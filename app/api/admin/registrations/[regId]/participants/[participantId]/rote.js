import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventRegistration from '@/models/eventreg.model';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin';

export async function PATCH(req, { params }) {
    try {
        await dbConnect();

        // 1. Verify Admin Auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const adminUser = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
        }

        const { regId, participantId } = params;
        const body = await req.json();
        const { isQualifiedDay2 } = body;

        if (isQualifiedDay2 === undefined) {
            return NextResponse.json({ error: "Missing isQualifiedDay2 field" }, { status: 400 });
        }

        // 2. Update the specific participant inside the group registration
        const updatedReg = await EventRegistration.findOneAndUpdate(
            { _id: regId, "participants._id": participantId },
            { 
                $set: { "participants.$.isQualifiedDay2": isQualifiedDay2 } 
            },
            { new: true }
        );

        if (!updatedReg) {
            return NextResponse.json({ error: "Registration or Participant not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Participant qualification updated successfully" 
        }, { status: 200 });

    } catch (error) {
        console.error("Qualify Participant API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}