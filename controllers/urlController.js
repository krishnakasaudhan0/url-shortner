const { db } = require("../config/firebase");
const { ref, set, get, child, update } = require("firebase/database");
const generateCode = require("../utils/generatecode");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const renderIndex = (req, res) => {
    let user = null;
    if (req.cookies.token) {
        try {
            user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        } catch (error) {
            // Invalid token
        }
    }
    res.render("index", { user: user, error: null });
};

const createShortUrl = async (req, res) => {
    try {
        let { originalUrl, customCode, expiresIn } = req.body;
        
        // Validation for protocol
        if (!/^https?:\/\//i.test(originalUrl)) {
            originalUrl = 'http://' + originalUrl;
        }

        // Strict URL Validation using validator package
        if (!validator.isURL(originalUrl, { require_protocol: true, require_valid_protocol: true })) {
            return res.status(400).render("index", { 
                user: req.user, 
                error: "Invalid URL provided. Please enter a valid website address." 
            });
        }

        const code = generateCode();
        // Use customCode if provided, else use the generated code
        const alias = customCode ? customCode : code;
        const shortUrlPath = `http://localhost:${process.env.PORT || 3000}/${alias}/${code}`;
        
        // Save to Realtime Database 'links' directly under the code key (avoids index rules)
        const linkRef = ref(db, `links/${code}`);
        await set(linkRef, {
            originalUrl,
            customCode: customCode || "",
            expiresIn: expiresIn ? parseInt(expiresIn) : null,
            shortUrl: code,
            alias: alias,
            createdAt: Date.now(),
            user: req.user.userid 
        });

        // Add to user relationships in Realtime Database as a key
        const userLinkRef = ref(db, `users/${req.user.userid}/links/${code}`);
        await set(userLinkRef, true);

        res.render("index", { shortUrl: shortUrlPath, user: req.user, error: null });
    } catch (error) {
        console.error(error);
        next(error); // Pass to Global Error Handler
    }
};

const redirectToOriginalUrl = async (req, res) => {
    let user = null;
    if (req.cookies.token) {
        try { user = jwt.verify(req.cookies.token, process.env.JWT_SECRET); } catch(e){}
    }

    try {
        const { code } = req.params;
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `links/${code}`));
        
        if (!snapshot.exists()) {
            return res.status(404).render("index", { user, error: "The requested short link does not exist or has expired." });
        }
        
        const linkData = snapshot.val();
        
        // Active Expiration Check
        if (linkData.expiresIn && linkData.createdAt) {
            const expirationTimeMs = linkData.createdAt + (linkData.expiresIn * 1000);
            if (Date.now() > expirationTimeMs) {
                return res.status(410).render("index", { user, error: "This short link has expired." });
            }
        }
        
        res.redirect(linkData.originalUrl);
    } catch (error) {
        console.error(error);
        next(error); // Pass to Global Error Handler
    }
};

const renderProfile = async (req, res) => {
    try {
        const dbRef = ref(db);
        const userSnap = await get(child(dbRef, `users/${req.user.userid}`));
        
        if (!userSnap.exists()) {
            return res.redirect("/login");
        }
        
        const userData = userSnap.val();
        let userLinks = [];
        
        if (userData.links) {
            const linkKeys = Object.keys(userData.links);
            for (const key of linkKeys) {
                const linkSnap = await get(child(dbRef, `links/${key}`));
                if (linkSnap.exists()) {
                    userLinks.push(linkSnap.val());
                }
            }
        }
        
        res.render("profile", { user: userData, links: userLinks, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).render("profile", { user: { name: "Error", email: "" }, links: [], error: "Failed to load profile data." });
    }
};

module.exports = {
    renderIndex,
    createShortUrl,
    redirectToOriginalUrl,
    renderProfile
};
