// This file configures and initializes the Firebase application instance.
// It reads the configuration from environment variables and exports the initialized auth and firestore services.
// NOTE: This setup ensures Firebase is initialized only once, preventing common errors.

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration, sourced from environment variables.
// It's crucial that these are prefixed with NEXT_PUBLIC_ to be accessible on the client side.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Firebase Initialization ---

// Check if a Firebase app has already been initialized. If not, initialize it.
// This is a standard pattern to prevent re-initialization on hot reloads in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- Service Exports ---

// Export the authentication service, making it available for use throughout the application.
export const auth = getAuth(app);

// Export the Firestore database service.
export const db = getFirestore(app);

// --- Startup Verification Log ---
// This log helps confirm that the Firebase config is being loaded correctly when the server starts.
// It's a useful check during setup and debugging.
if (typeof window === 'undefined') { // Only log on the server
    console.log("✅ Firebase Config Loaded on Server");
    if (firebaseConfig.apiKey && firebaseConfig.authDomain) {
      console.log(`🔑 Auth Domain: ${firebaseConfig.authDomain}`);
      console.log("-> Please ensure this domain is in your Firebase project's 'Authorized domains' list for authentication.");
    } else {
      console.error("❌ CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not configured in your .env file!");
    }
}
