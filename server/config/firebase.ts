import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let db: Firestore;
let auth: Auth;

/**
 * Initialize Firebase Admin SDK
 * Uses GOOGLE_APPLICATION_CREDENTIALS env var for service account
 */
export function initializeFirebase(): void {
    if (getApps().length === 0) {
        // Check for service account credentials
        const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        if (serviceAccount) {
            // Using service account file path
            app = initializeApp({
                credential: cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else if (process.env.FIREBASE_PROJECT_ID) {
            // Using default credentials (Cloud Run, GCE, etc.)
            app = initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else {
            throw new Error(
                'Firebase credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID'
            );
        }

        db = getFirestore(app);
        auth = getAuth(app);

        console.log('✅ Firebase Admin SDK initialized');
    }
}

/**
 * Get Firestore instance
 */
export function getDb(): Firestore {
    if (!db) {
        initializeFirebase();
        db = getFirestore();
    }
    return db;
}

/**
 * Get Auth instance
 */
export function getAuthAdmin(): Auth {
    if (!auth) {
        initializeFirebase();
        auth = getAuth();
    }
    return auth;
}

// Collection names
export const Collections = {
    NOTEBOOKS: 'notebooks',
    SOURCES: 'sources',
    MESSAGES: 'messages',
    EMBEDDINGS: 'embeddings'
} as const;
