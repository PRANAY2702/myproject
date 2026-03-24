import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';
import EventRegistration from '@/models/eventreg.model';
import admin from '@/lib/firebaseAdmin';

export async function PATCH(req) {
    try {
        await dbConnect();

        // 1. Verify Admin Auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const adminUser = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'registration')) {
            return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
        }

        const body = await req.json();
        const { registrationCode, day, participantIds } = body;

        if (!registrationCode || !day) {
            return NextResponse.json({ error: "Registration code and day are required" }, { status: 400 });
        }

        // 2. Find User by Code
        const user = await User.findOne({ registrationCode: registrationCode.toUpperCase() });
        if (!user) {
            return NextResponse.json({ error: "Invalid registration code" }, { status: 404 });
        }

        // 3. Find their Registrations
        const registrations = await EventRegistration.find({ userId: user._id });
        if (!registrations || registrations.length === 0) {
            return NextResponse.json({ error: "User has no registrations" }, { status: 404 });
        }

        // Check if any registration is verified
        const isVerified = registrations.some(reg => reg.paymentStatus === 'verified');
        if (!isVerified) {
            return NextResponse.json({ error: "Payment not verified yet." }, { status: 400 });
        }

        const isDay2 = day === 2;
        let updatePromises = [];

        // 4. Update Logic (Group vs Single)
        for (let reg of registrations) {
            const isGroup = reg.registrationType === 'group5' || reg.registrationType === 'group10';

            if (isGroup && participantIds && participantIds.length > 0) {
                // Update specific participants inside the array
                for (let pId of participantIds) {
                    let updateField = isDay2 ? "participants.$.isPresentDay2" : "participants.$.isPresentDay1";
                    
                    updatePromises.push(
                        EventRegistration.updateOne(
                            { _id: reg._id, "participants._id": pId },
                            { $set: { [updateField]: true } }
                        )
                    );
                }
            } else if (!isGroup) {
                // Standard Single Entry Update
                if (isDay2 && !reg.dayTwoAccess && !user.isSelectedDay2) {
                    throw new Error("User is not authorized for Day 2.");
                }
                
                reg.dayOneAttendance = !isDay2 ? true : reg.dayOneAttendance;
                reg.dayTwoAttendance = isDay2 ? true : reg.dayTwoAttendance;
                updatePromises.push(reg.save());
            }
        }

        await Promise.all(updatePromises);

        return NextResponse.json({ 
            success: true, 
            fullName: user.fullName,
            message: `Attendance marked for Day ${day}`
        }, { status: 200 });

    } catch (error) {
        console.error("Attendance API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}