
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

// --- CRITICAL VALIDATION ---
// This check runs once when the app loads. If the API key is missing,
// it logs a severe error to the server console, which is essential for debugging.
if (!firebaseConfig.apiKey) {
  console.error("************************************************************************************");
  console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is MISSING.");
  console.error("The application will not function correctly without it.");
  console.error("Please ensure your .env file is in the project root and contains all the required");
  console.error("NEXT_PUBLIC_FIREBASE_... variables from your Firebase project settings.");
  console.error("After editing the .env file, you MUST restart your development server.");
  console.error("************************************************************************************");
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
