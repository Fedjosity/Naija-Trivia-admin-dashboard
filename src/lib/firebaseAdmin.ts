import * as admin from 'firebase-admin';

/**
 * Singleton pattern for Firebase Admin SDK in Next.js
 */
export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : null;

    admin.initializeApp({
      credential: serviceAccount ? admin.credential.cert(serviceAccount) : undefined,
      projectId: 'naija-trivia',
      storageBucket: 'naija-trivia.firebasestorage.app'
    });
  }
  return {
    db: admin.firestore(),
    storage: admin.storage(),
    auth: admin.auth(),
  };
}
