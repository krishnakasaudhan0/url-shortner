const { auth, db } = require("../config/firebase");
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} = require("firebase/auth");
const { ref, set, get, child } = require("firebase/database");
const jwt = require("jsonwebtoken");

const renderSignup = (req, res) => {
    res.render("signup", { error: null });
};

const handleSignup = async (req, res) => {
    const {name, email, password} = req.body;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await set(ref(db, 'users/' + user.uid), {
            name: name,
            email: email,
            links: []
        });
        
        let token = jwt.sign({ email: user.email, userid: user.uid }, process.env.JWT_SECRET);
        res.cookie("token", token);
        res.redirect("/");
        
    } catch (error) {
        console.error(error.code, error.message);
        if (error.code === 'auth/email-already-in-use') {
             return res.status(400).render("signup", { error: "A user with this email already exists." });
        }
        res.status(500).render("signup", { error: "Error creating user: " + error.message });
    }
};

const renderLogin = (req, res) => {
    res.render("login", { error: null });
};

const handleLogin = async (req, res) => {
    try {
        const {email, password} = req.body;
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let token = jwt.sign({ email: user.email, userid: user.uid }, process.env.JWT_SECRET);
        res.cookie("token", token);
        res.redirect("/");

    } catch (error) {
        console.error(error.code, error.message);
        if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
             return res.status(401).render("login", { error: "Invalid credentials. Please check your email and password." });
        }
        res.status(500).render("login", { error: "Login failed: " + error.message });
    }
};

const handleGoogleLogin = async (req, res) => {
    try {
        const { idToken, email, displayName, uid } = req.body;
        
        // Ensure user document exists in Realtime Database
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        
        if (!snapshot.exists()) {
             await set(ref(db, 'users/' + uid), {
                 name: displayName || "Google User",
                 email: email,
                 links: []
             });
        }
        
        // Sign JWT using their firebase UID
        let token = jwt.sign({ email: email, userid: uid }, process.env.JWT_SECRET);
        res.cookie("token", token);
        // Send success payload back to the client-side fetch request
        res.json({ success: true, redirectUrl: "/" });
        
    } catch (error) {
         console.error(error);
         res.status(500).json({ success: false, error: "Google authentication failed on server" });
    }
}

const handleLogout = (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
};

module.exports = {
    renderSignup,
    handleSignup,
    renderLogin,
    handleLogin,
    handleGoogleLogin,
    handleLogout
};
