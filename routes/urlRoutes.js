const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { renderIndex, createShortUrl, redirectToOriginalUrl, renderProfile } = require("../controllers/urlController");
const isLoggedIn = require("../utils/isLoggedIn");

// Rate Limiter for URL Creation (e.g., max 20 requests per 15 minutes per IP)
const createUrlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many links created from this IP, please try again after 15 minutes.",
    handler: (req, res, next, options) => {
        // Return structured UI error instead of raw text
        res.status(options.statusCode).render("index", {
            user: req.user || null,
            error: options.message
        });
    }
});

router.get("/", renderIndex);
router.post("/api/url", isLoggedIn, createUrlLimiter, createShortUrl);
router.get("/profile", isLoggedIn, renderProfile);
router.get("/:alias/:code", redirectToOriginalUrl);

module.exports = router;
