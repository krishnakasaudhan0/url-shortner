const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Route Middlewares
app.use("/", authRoutes);
app.use("/", urlRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Global Error Caught:", err.message || err);
    
    // Pass the user if they were already authenticated earlier in the request
    const user = req.user || null;
    
    // Render the index page with a generic error toast to prevent white screens
    res.status(err.status || 500).render("index", { 
        user: user, 
        error: "An unexpected server error occurred. Please try again later." 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});