import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user.model";
import admin from "@/lib/firebaseAdmin";
import crypto from "crypto";

// Verify Firebase token
async function verifyAuth(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split("Bearer ")[1];
    return await admin.auth().verifyIdToken(token);
}

// Generate unique registration code
async function generateUniqueRegistrationCode() {
    let code;
    let exists = true;

    while (exists) {
        code = "SP" + crypto.randomBytes(3).toString("hex").toUpperCase();
        const user = await User.findOne({ registrationCode: code });
        exists = !!user;
    }

    return code;
}

export async function POST(request) {
    try {
        await dbConnect();
        const decodedToken = await verifyAuth(request);

        const { uid, email, name } = decodedToken;

        let user = await User.findOne({ firebaseUid: uid });

        // 🔥 CASE 1: User does not exist → Create
        if (!user) {
            const registrationCode = await generateUniqueRegistrationCode();

            user = await User.create({
                firebaseUid: uid,
                email,
                fullName: name || "Participant",
                registrationCode,
            });

            return NextResponse.json(user, { status: 201 });
        }

        // 🔥 CASE 2: User exists but registrationCode missing
        if (!user.registrationCode) {
            const registrationCode = await generateUniqueRegistrationCode();

            user.registrationCode = registrationCode;
            await user.save();
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error) {
        console.error("Sync User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}