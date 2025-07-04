
// Firebase Configuration File for LearnMint
// This file initializes Firebase and sets up authentication.
// It's crucial that the environment variables are correctly set in your .env file.

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Firebase Configuration Object ---
// It's critical that these environment variables are defined in your .env file.
// In Next.js, variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// --- CRITICAL VALIDATION & LOGGING ---
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.error(
    '************************************************************************************\n' +
    'CRITICAL FIREBASE CONFIG ERROR: One or more Firebase variables are MISSING.\n' +
    'The application will not function correctly without them.\n' +
    'Please ensure your .env file in the project root contains all the required\n' +
    'NEXT_PUBLIC_FIREBASE_... variables from your Firebase project settings.\n' +
    'After editing the .env file, you MUST restart your development server.\n' +
    '************************************************************************************'
  );
} else {
  // Add a success/info log so the user knows the keys ARE being read.
  console.log(
    '********************************************************\n' +
    'Firebase config loaded successfully.\n' +
    `Project ID: ${firebaseConfig.projectId}\n` +
    `Auth Domain: ${firebaseConfig.authDomain}\n` +
    'If sign-in fails, ensure this Auth Domain is added to\n' +
    'the "Authorized domains" list in Firebase Authentication settings.\n' +
    '********************************************************'
  );
}


// --- Firebase Initialization ---
// Initialize Firebase. If an app instance already exists, use it; otherwise, create a new one.
// This pattern prevents re-initializing the app on hot reloads in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- Firebase Services ---
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- Exports ---
export { app, auth, db, googleProvider };
