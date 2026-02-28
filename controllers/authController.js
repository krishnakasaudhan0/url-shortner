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
            return res.status(401).json({ success: false, error: "No ID token provided." });
        }

        // Verify the Firebase ID Token using Admin SDK
        const decodedToken = await adminAuth.verifyIdToken(idToken);
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
        console.error("Token Verification Error:", error);
        res.status(401).json({ success: false, error: "Authentication failed. Token invalid or expired." });
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
