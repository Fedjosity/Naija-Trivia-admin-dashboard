import * as admin from 'firebase-admin';

/**
 * Singleton pattern for Firebase Admin SDK in Next.js
 */
export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccount = serviceAccountVar && serviceAccountVar.startsWith('{') 
      ? JSON.parse(serviceAccountVar) 
      : null;

    const options: admin.AppOptions = {
      projectId: 'naija-trivia',
      storageBucket: 'naija-trivia.firebasestorage.app'
    };

    if (serviceAccount) {
      options.credential = admin.credential.cert(serviceAccount);
    }

    try {
      admin.initializeApp(options);
    } catch (e) {
      // In case of multiple workers or races, ignore re-initialization errors
      console.warn("Firebase Admin Initialization Check:", e);
    }
  }
  return {
    db: admin.firestore(),
    storage: admin.storage(),
    auth: admin.auth(),
  };
}
