import admin from '@/lib/firebaseAdmin';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';

export async function verifyAdmin(request, allowedRoles = []) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    await dbConnect();

    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) throw new Error('User not found');

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        throw new Error('Forbidden');
    }

    return user;
}