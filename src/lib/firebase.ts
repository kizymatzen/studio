
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log("Firebase API Key loaded:", apiKey); // Log the API key being used

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined = undefined;
let authInstance: Auth | undefined = undefined;
let dbInstance: Firestore | undefined = undefined;
let storageInstance: FirebaseStorage | undefined = undefined;

const isPlaceholderKey = (key: string | undefined): boolean =>
  !key || key.includes("YOUR_") || key === "YOUR_API_KEY";

if (!getApps().length) {
  if (isPlaceholderKey(firebaseConfig.apiKey)) {
    console.error(
      "****************************************************************************************\n" +
      "ERROR: Firebase API Key is missing, uses a placeholder, or is not correctly set.\n" +
      "Please ensure that NEXT_PUBLIC_FIREBASE_API_KEY in your .env file (at the project root)\n" +
      "is correctly set up with your valid Firebase API key.\n" +
      "After updating the .env file, YOU MUST RESTART your development server.\n" +
      "Firebase will not be initialized until this is resolved.\n" +
      "Current API Key read: " + firebaseConfig.apiKey + "\n" +
      "****************************************************************************************"
    );
    // app remains undefined
  } else {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
    } catch (error) {
      console.error("Firebase initialization failed even though API key seemed valid. Error:", error);
      // app might be partially initialized or undefined
    }
  }
} else {
  app = getApps()[0];
  if (isPlaceholderKey(app.options.apiKey as string | undefined)) {
     console.error(
      "****************************************************************************************\n" +
      "ERROR: Firebase app was previously initialized but seems to be using a placeholder API key.\n" +
      "This can happen if the .env file was not updated or the server was not restarted after changes.\n" +
      "Current API Key in initialized app: " + app.options.apiKey + "\n" +
      "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY in .env is correct and restart the server.\n" +
      "****************************************************************************************"
    );
    app = undefined; // Mark app as uninitialized for subsequent checks
  } else if (app.options.apiKey) {
    console.log("Firebase app already initialized.");
  }
}

// Initialize Firebase services only if the app was successfully initialized with a valid key
if (app && !isPlaceholderKey(app.options.apiKey as string | undefined)) {
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);
} else {
  if (!isPlaceholderKey(firebaseConfig.apiKey)) { // Only warn if the main error wasn't the placeholder key itself
    console.warn(
      "Firebase app is not initialized or uses an invalid API key. Firebase services (Auth, Firestore, Storage) will not be available. " +
      "This might be due to an issue during initialization or an incorrect API key in .env."
    );
  }
}

export { app };

export function getAuthSafe(): Auth {
  if (!authInstance) {
    throw new Error(
      "Firebase Auth is not initialized. Check Firebase configuration, API key, and ensure the Identity Toolkit API is enabled in your Firebase project."
    );
  }
  return authInstance;
}

export function getDbSafe(): Firestore {
  if (!dbInstance) {
    throw new Error(
      "Firebase Firestore is not initialized. Check Firebase configuration, API key, and ensure Firestore (Native mode or Datastore mode) is set up in your Firebase project."
    );
  }
  return dbInstance;
}

export function getStorageSafe(): FirebaseStorage {
  if (!storageInstance) {
    throw new Error(
      "Firebase Storage is not initialized. Check Firebase configuration and API key."
    );
  }
  return storageInstance;
}
