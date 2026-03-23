import admin from 'firebase-admin';

const formatPrivateKey = (key) => {
    if (!key) return undefined;
    return key.replace(/\\n/g, '\n');
};

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
            }),
        });
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error.stack);
    }
}

export default admin;