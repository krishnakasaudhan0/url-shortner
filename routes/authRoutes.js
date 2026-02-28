const express = require("express");
const router = express.Router();
const {
    renderSignup,
    handleSignup,
    renderLogin,
    handleLogin,
    handleGoogleLogin,
    handleLogout
} = require("../controllers/authController");

router.get("/signup", renderSignup);
router.post("/signup", handleSignup);

router.get("/login", renderLogin);
router.post("/login", handleLogin);

router.post("/auth/google", handleGoogleLogin);

router.get("/logout", handleLogout);

module.exports = router;
