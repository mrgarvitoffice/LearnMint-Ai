
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Log the API key being used (or if it's undefined)
// This log will appear in the terminal where your Next.js dev server is running
console.log(`Firebase Config: Attempting to use API Key: ${apiKeyFromEnv}`);

if (!apiKeyFromEnv) {
  console.error("************************************************************************************");
  console.error("CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is UNDEFINED or not loaded.");
  console.error("This means your .env file might be missing, in the wrong location (must be project root),");
  console.error("or the variable NEXT_PUBLIC_FIREBASE_API_KEY is not set correctly within it,");
  console.error("OR you haven't restarted your Next.js server after .env changes.");
  console.error("The application will likely fail to connect to Firebase.");
  console.error("************************************************************************************");
  // Optionally, you could throw an error here to halt execution if the key is critical and missing
  // throw new Error("Firebase API Key is missing. Check server logs for details.");
}

const firebaseConfig: FirebaseOptions = {
  apiKey: apiKeyFromEnv, // Reverted to use the environment variable
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Conditionally add measurementId if it's set in the environment
if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID.trim() !== '') {
  firebaseConfig.measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
}

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
