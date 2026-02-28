const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");
const { getAuth } = require("firebase/auth");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

let app, db, auth;

try {
    // Only initialize if we have the critical apiKey, otherwise Vercel Serverless boots will fatally crash
    if (process.env.FIREBASE_API_KEY) {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
    } else {
        console.warn("Firebase warning: FIREBASE_API_KEY is undefined. Firebase is not initialized.");
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

module.exports = { app, db, auth };
