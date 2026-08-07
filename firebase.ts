import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let dbInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!getApps().length) {
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    try {
      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('Firebase Admin SDK initialized successfully with service account credentials.');
      } else if (projectId) {
        initializeApp({ projectId });
        console.log(`Firebase Admin SDK initialized with project ID: ${projectId}`);
      } else {
        console.warn('Firebase configuration missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
        return null;
      }
    } catch (err) {
      console.error('Failed to initialize Firebase Admin SDK:', err);
      return null;
    }
  }

  if (!dbInstance) {
    try {
      dbInstance = getFirestore();
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch (err) {
      console.error('Failed to obtain Firestore instance:', err);
      return null;
    }
  }

  return dbInstance;
}
