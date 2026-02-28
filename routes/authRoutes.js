const express = require("express");
const router = express.Router();
const {
    renderSignup,
    renderLogin,
    handleTokenAuth,
    handleLogout
} = require("../controllers/authController");

router.get("/signup", renderSignup);
router.post("/signup", handleTokenAuth);

router.get("/login", renderLogin);
router.post("/login", handleTokenAuth);

router.post("/auth/google", handleTokenAuth);

router.get("/logout", handleLogout);

module.exports = router;
