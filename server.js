const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// Serve WebApp Files
app.use(express.static(path.join(__dirname, "webapp")));

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "webapp", "index.html"));
});

// Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "online",
        app: "EarnBD-Pro"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
