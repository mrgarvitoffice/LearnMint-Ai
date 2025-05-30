
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomainFromEnv = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucketFromEnv = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementIdFromEnv = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

// Log the API key and Auth Domain being used (or if they are undefined)
// This log will appear in the terminal where your Next.js dev server is running
console.log(`Firebase Config: Attempting to use API Key: ${apiKeyFromEnv}`);
console.log(`Firebase Config: Attempting to use Auth Domain: ${authDomainFromEnv}`);
console.log(`Firebase Config: Attempting to use Project ID: ${projectIdFromEnv}`);


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


const firebaseConfig: FirebaseOptions = {
  apiKey: apiKeyFromEnv,
  authDomain: authDomainFromEnv,
  projectId: projectIdFromEnv,
  storageBucket: storageBucketFromEnv,
  messagingSenderId: messagingSenderIdFromEnv,
  appId: appIdFromEnv,
  measurementId: measurementIdFromEnv, // Can be undefined if not provided
};

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

