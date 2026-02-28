const { adminAuth, db } = require("../config/firebase");
const { ref, set, get, child } = require("firebase/database");
const jwt = require("jsonwebtoken");

const renderSignup = (req, res) => {
    res.render("signup", { error: null });
};

const handleTokenAuth = async (req, res) => {
    try {
        const { idToken, name } = req.body;
        
        if (!idToken) {
            console.error("[Auth] Blank idToken received in body");
            return res.status(401).json({ success: false, error: "No ID token provided." });
        }

        // Verify the Firebase ID Token using Admin SDK
        console.log(`[Auth] Attempting to verify token of length ${idToken.length}...`);
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        console.log(`[Auth] Token actively verified for UID: ${decodedToken.uid}`);
        
        const { uid, email, name: googleName } = decodedToken;
        const displayName = name || googleName || email.split('@')[0];

        // Ensure user document exists in Realtime Database
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        
        if (!snapshot.exists()) {
             await set(ref(db, 'users/' + uid), {
                 name: displayName,
                 email: email,
                 links: []
             });
        }
        
        // Sign custom JWT for our app session cookie
        let token = jwt.sign({ email: email, userid: uid }, process.env.JWT_SECRET);
        res.cookie("token", token);
        
        res.json({ success: true, redirectUrl: "/" });
        
    } catch (error) {
        console.error("[Auth Fatal Error] verifyIdToken failed completely:");
        console.error("  - Code:", error.code);
        console.error("  - Message:", error.message);
        
        if (error.code === "auth/id-token-expired") {
            return res.status(401).json({ success: false, error: "Firebase Token has expired. Please log in again." });
        }
        if (error.code === "auth/argument-error") {
            // Usually means firebase-admin isn't initialized correctly or project mismatch
            return res.status(401).json({ success: false, error: "Vercel Admin Initialization failure." });
        }
        
        res.status(401).json({ success: false, error: `Auth error: ${error.message}` });
    }
};

const renderLogin = (req, res) => {
    res.render("login", { error: null });
};

const handleLogout = (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
};

module.exports = {
    renderSignup,
    renderLogin,
    handleTokenAuth,
    handleLogout
};
