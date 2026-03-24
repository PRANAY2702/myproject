import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventRegistration from '@/models/eventreg.model';
import User from '@/models/user.model';
import admin from '@/lib/firebaseAdmin';

export async function PATCH(req, props) {
    try {
        await dbConnect();

        // 1. Verify Admin Auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        const adminUser = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'finance')) {
            return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
        }

        // 2. Safely extract the ID
        const params = await props.params;
        const { id } = params;

        const body = await req.json();

        // --- SCENARIO A: QUALIFY A SPECIFIC GROUP PARTICIPANT ---
        if (body.participantId && body.isQualifiedDay2 !== undefined) {
            const updatedReg = await EventRegistration.findOneAndUpdate(
                { _id: id, "participants._id": body.participantId },
                { $set: { "participants.$.isQualifiedDay2": body.isQualifiedDay2 } },
                { new: true }
            );

            if (!updatedReg) {
                return NextResponse.json({ error: "Registration or Participant not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: "Participant qualification updated" }, { status: 200 });
        }

        // --- SCENARIO B: APPROVE/REJECT PAYMENT STATUS ---
        if (body.paymentStatus) {
            const updatedReg = await EventRegistration.findByIdAndUpdate(
                id,
                { paymentStatus: body.paymentStatus },
                { new: true }
            );

            if (!updatedReg) {
                return NextResponse.json({ error: "Registration not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: "Payment status updated" }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    } catch (error) {
        console.error("Registration PATCH API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}