
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
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.apiKey === "YOUR_API_KEY") {
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
    // app remains undefined, preventing Firebase from trying to initialize with a bad key
  } else {
    // API key seems to be present and not a placeholder, attempt initialization
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully."); // Log success
    } catch (error) {
      console.error("Firebase initialization failed even though API key seemed valid. Error:", error);
      // app might be partially initialized or undefined, depending on the error
    }
  }
} else {
  app = getApps()[0];
  // Check if the already initialized app is using a placeholder key
  if (app.options.apiKey && (app.options.apiKey.includes("YOUR_") || app.options.apiKey === "YOUR_API_KEY")) {
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
if (app && app.options.apiKey && !app.options.apiKey.includes("YOUR_") && app.options.apiKey !== "YOUR_API_KEY") {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Only log this warning if the initial error wasn't due to a placeholder API key
  // (which would have already been logged with more detail)
  if (!( !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.apiKey === "YOUR_API_KEY" )) {
    console.warn(
      "Firebase app is not initialized or uses an invalid API key. Firebase services (Auth, Firestore, Storage) will not be available. " +
      "This might be due to an issue during initialization or an incorrect API key in .env."
    );
  }
  // Assign null to satisfy type strictness, other parts of the app should handle this.
  // @ts-ignore
  auth = null;
  // @ts-ignore
  db = null;
  // @ts-ignore
  storage = null;
}

export { app, auth, db, storage };
