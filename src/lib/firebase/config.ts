// Firebase Configuration File for LearnMint
// This file initializes Firebase and sets up authentication.
// It's crucial that the environment variables are correctly set in your .env file.

// Import necessary functions from Firebase SDKs
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Environment Variable Retrieval ---
// Retrieve Firebase configuration values from environment variables.
// These variables MUST start with NEXT_PUBLIC_ to be accessible on the client-side.
const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomainFromEnv = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucketFromEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional for Firebase Analytics

// --- Configuration Logging & Validation (Server-Side) ---
// These logs will appear in the terminal where your Next.js development server is running.
// They help diagnose issues with .env file loading or incorrect variable names.
console.log(`Firebase Config: Attempting to use API Key: ${apiKeyFromEnv}`);
console.log(`Firebase Config: Attempting to use Auth Domain: ${authDomainFromEnv}`);
console.log(`Firebase Config: Attempting to use Project ID: ${projectIdFromEnv}`);

// Critical validation checks for essential Firebase configuration variables.
if (!apiKeyFromEnv) {
  console.error("************************************************************************************");
  console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is UNDEFINED or not loaded.");
  console.error("This means your .env file might be missing, in the wrong location (must be project root),");
  console.error("or the variable NEXT_PUBLIC_FIREBASE_API_KEY is not set correctly within it,");
  console.error("OR you haven't restarted your Next.js server after .env changes.");
  console.error("The application will likely fail to connect to Firebase.");
  console.error("************************************************************************************");
}

if (!authDomainFromEnv) {
  console.error("************************************************************************************");
  console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is UNDEFINED or not loaded.");
  console.error("This means your .env file might be missing, in the wrong location (must be project root),");
  console.error("or the variable NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set correctly (e.g., your-project-id.firebaseapp.com),");
  console.error("OR you haven't restarted your Next.js server after .env changes.");
  console.error("Firebase Authentication will fail.");
  console.error("************************************************************************************");
}

if (!projectIdFromEnv) {
  console.error("************************************************************************************");
  console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_PROJECT_ID is UNDEFINED or not loaded.");
  console.error("This means your .env file might be missing, in the wrong location (must be project root),");
  console.error("or the variable NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set correctly within it,");
  console.error("OR you haven't restarted your Next.js server after .env changes.");
  console.error("Firebase features relying on Project ID might fail.");
  console.error("************************************************************************************");
}

// --- Firebase Configuration Object ---
const firebaseConfig: FirebaseOptions = {
  apiKey: apiKeyFromEnv,
  authDomain: authDomainFromEnv,
  projectId: projectIdFromEnv,
  storageBucket: storageBucketFromEnv,
  messagingSenderId: messagingSenderIdFromEnv,
  appId: appIdFromEnv,
  measurementId: measurementIdFromEnv, // Can be undefined if not provided/used
};

// --- Firebase Initialization ---
// Initialize Firebase. If an app instance already exists, use it; otherwise, create a new one.
// This pattern prevents re-initializing the app on hot reloads in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- Firebase Authentication Setup ---
// Get the Firebase Auth instance associated with the initialized app.
const auth = getAuth(app);
// Get the Firestore database instance
const db = getFirestore(app);
// Create a new GoogleAuthProvider instance for Google Sign-In.
const googleProvider = new GoogleAuthProvider();

// --- Exports ---
// Export the initialized app, auth instance, and Google provider for use throughout the application.
export { app, auth, db, googleProvider };
