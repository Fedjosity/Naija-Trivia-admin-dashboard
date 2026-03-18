import * as admin from 'firebase-admin';

/**
 * Singleton pattern for Firebase Admin SDK in Next.js
 */
export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      // We assume GOOGLE_APPLICATION_CREDENTIALS covers this,
      // or we can fallback to projectID if using ADC.
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
