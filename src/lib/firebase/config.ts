
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Added GoogleAuthProvider
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// --- TEMPORARY HARDCODED VALUES FOR DEBUGGING ---
// IMPORTANT: Revert to using process.env.NEXT_PUBLIC_FIREBASE_... variables
// from your .env file for security and proper configuration, especially before production.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCNcktsyCTevZebTrc4aBnG4b0pRbYx4tk",
  authDomain: "learnflow-go3hi.firebaseapp.com",
  projectId: "learnflow-go3hi",
  storageBucket: "learnflow-go3hi.appspot.com", // Using the value you provided
  messagingSenderId: "245611903044",
  appId: "1:245611903044:web:007b0b6b76181d06c1a411"
  // measurementId is optional and was not provided in your snippet.
};
// --- END OF TEMPORARY HARDCODED VALUES ---

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); // Exported for use

export { app, auth, googleProvider }; // Export googleProvider
