const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");
const admin = require("firebase-admin");

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

let app, db, adminAuth;

try {
    if (process.env.FIREBASE_API_KEY) {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
    } else {
        console.warn("Firebase Mod warning: FIREBASE_API_KEY missing.");
    }
} catch (error) {
    console.error("Firebase Modular Init Error:", error);
}

try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        adminAuth = admin.auth();
    } else {
        console.warn("Firebase Admin warning: Missing Admin Env Vars.");
    }
} catch (error) {
    if (!/already exists/.test(error.message)) {
         console.error("Firebase Admin Init Error:", error);
    }
}

module.exports = { app, db, adminAuth };
