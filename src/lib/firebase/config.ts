
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// const authDomainFromEnv = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

// Log the API key and Auth Domain being used (or if they are undefined)
// This log will appear in the terminal where your Next.js dev server is running
// console.log(`Firebase Config: Attempting to use API Key from env: ${apiKeyFromEnv}`);
// console.log(`Firebase Config: Attempting to use Auth Domain from env: ${authDomainFromEnv}`);

// if (!apiKeyFromEnv) {
//   console.error("************************************************************************************");
//   console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is UNDEFINED or not loaded.");
//   console.error("This means your .env file might be missing, in the wrong location (must be project root),");
//   console.error("or the variable NEXT_PUBLIC_FIREBASE_API_KEY is not set correctly within it,");
//   console.error("OR you haven't restarted your Next.js server after .env changes.");
//   console.error("The application will likely fail to connect to Firebase.");
//   console.error("************************************************************************************");
// }

// if (!authDomainFromEnv) {
//   console.error("************************************************************************************");
//   console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is UNDEFINED or not loaded.");
//   console.error("This means your .env file might be missing, in the wrong location (must be project root),");
//   console.error("or the variable NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set correctly (e.g., your-project-id.firebaseapp.com),");
//   console.error("OR you haven't restarted your Next.js server after .env changes.");
//   console.error("Firebase Authentication will fail.");
//   console.error("************************************************************************************");
// }

// ====================================================================================
// TEMPORARY HARDCODED FIREBASE CONFIGURATION
// Replace these placeholder values with your ACTUAL Firebase project credentials.
// This is a temporary measure to bypass .env file loading issues.
// You should fix your .env setup and then revert this hardcoding.
// ====================================================================================
const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_ACTUAL_FIREBASE_API_KEY", // REPLACE THIS
  authDomain: "YOUR_ACTUAL_PROJECT_ID.firebaseapp.com", // REPLACE THIS
  projectId: "YOUR_ACTUAL_PROJECT_ID", // REPLACE THIS
  storageBucket: "YOUR_ACTUAL_PROJECT_ID.appspot.com", // REPLACE THIS
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID", // REPLACE THIS
  appId: "YOUR_ACTUAL_APP_ID", // REPLACE THIS
  measurementId: "YOUR_ACTUAL_MEASUREMENT_ID" // OPTIONAL: REPLACE or remove if not used
};
console.log("Firebase Config: USING TEMPORARILY HARDCODED CONFIG. PLEASE REPLACE PLACEHOLDERS WITH YOUR ACTUAL CREDENTIALS AND FIX .ENV SETUP.");
console.log("Firebase Config: Hardcoded API Key:", firebaseConfig.apiKey);
console.log("Firebase Config: Hardcoded Auth Domain:", firebaseConfig.authDomain);
// ====================================================================================

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); // Exported for use

export { app, auth, googleProvider };
