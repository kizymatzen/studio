
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Log the API key to ensure it's being loaded
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log('Firebase API Key loaded:', apiKey);

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.error(
      "Firebase API Key is not configured or is using a placeholder. " +
      "Please ensure your .env file is correctly set up with valid Firebase credentials " +
      "and that you have restarted the development server."
    );
    // To prevent Firebase from throwing its own error and show a more direct one in console
    // We won't initialize if the key is obviously wrong.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Ensure app is initialized before trying to get Auth, Firestore, Storage
// This check is more for robustness, the main issue is likely the API key itself.
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (app && app.options && app.options.apiKey && app.options.apiKey !== "YOUR_API_KEY") {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Provide dummy objects or handle the uninitialized state if necessary,
  // though the app will likely fail elsewhere if Firebase isn't up.
  // For now, this primarily highlights the API key issue.
  console.error("Firebase app was not initialized correctly due to missing or placeholder API key.");
  // @ts-ignore - Assigning null to satisfy type, knowing it will cause issues if used.
  auth = null;
  // @ts-ignore
  db = null;
  // @ts-ignore
  storage = null;
}


export { app, auth, db, storage };
