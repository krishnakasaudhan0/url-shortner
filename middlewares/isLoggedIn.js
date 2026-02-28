const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
const { ref, get, child } = require("firebase/database");

module.exports.isLoggedIn = async (req,res,next)=>{
    if(!req.cookies.token) {
        req.flash("error","you are not logged in");
        return res.redirect("/users/login");
    }
    try{
        let token = req.cookies.token;
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const dbRef = ref(db);
        const userSnap = await get(child(dbRef, `users/${decoded.userid}`));
        
        if (userSnap.exists()) {
            req.user = { ...userSnap.val(), userid: decoded.userid };
            next();
        } else {
            throw new Error("User not found in Firebase");
        }
    }catch(err){
        console.error("Middleware Auth Error:", err.message);
        req.flash("error","you are not logged in");
        res.redirect("/login");   
    }
}   