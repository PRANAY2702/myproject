import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventRegistration from '@/models/eventreg.model'; 
import User from '@/models/user.model'; 
import admin from '@/lib/firebaseAdmin'; 


export async function GET(req) {
    try {
        await dbConnect();

        // 1. Get and verify the Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 2. Find the user in MongoDB using the firebaseUid
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Fetch all registrations for this user
        // We only select 'eventId' because that's all your frontend needs to block selection
        const registrations = await EventRegistration.find({ 
            userId: user._id 
        }); // '-_id' excludes the mongo ID from the results for a cleaner response

        // 4. Return the array of eventIds
        return NextResponse.json(registrations, { status: 200 });

    } catch (error) {
        console.error("GET Registrations Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ... (Keep your existing imports and GET function untouched)

export async function POST(req) {
    try {
        await dbConnect();
        
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (!user.phone) return NextResponse.json({ error: "Please complete your profile before registration." }, { status: 400 });

        const body = await req.json();
        const { 
            eventsData,
            city, 
            requiresAccommodation, 
            appliedCoupon,
            registrationType, // <-- EXTRACT NEW FIELD
            participants      // <-- EXTRACT NEW FIELD
        } = body;

        const requestedEventIds = eventsData.map(e => e.eventId);
        const duplicateRegistrations = await EventRegistration.find({
            userId: user._id,
            eventId: { $in: requestedEventIds }
        });

        if (duplicateRegistrations.length > 0) {
            return NextResponse.json({ error: `Already registered` }, { status: 400 });
        }

        const registrationPromises = eventsData.map(async (eventItem) => {
            const newReg = await EventRegistration.create({
                userId: user._id,
                eventId: eventItem.eventId,
                city: city,
                requiresAccommodation: requiresAccommodation,
                couponCode: appliedCoupon || '',
                amountPaid: eventItem.amountPaid, 
                paymentStatus: 'pending',
                registrationType: registrationType || 'single', // <-- SAVE TO DB
                participants: participants || []                // <-- SAVE TO DB
            });

            await User.findByIdAndUpdate(user._id, {
                $push: { eventsRegistered: newReg._id }
            });

            return newReg;
        });

        await Promise.all(registrationPromises);

        return NextResponse.json({ success: true, message: "Registered successfully" }, { status: 201 });

    } catch (error) {
        console.error("Registration API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}