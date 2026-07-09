const express = require("express");
const path = require("path");
require("dotenv").config();

// Start Telegram Bot
require("./bot/bot");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve WebApp Files
app.use(express.static(path.join(__dirname, "webapp")));

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "webapp", "index.html"));
});

// Health Check
app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "online",
        app: "EarnBD-Pro",
        bot: "running"
    });
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log("🤖 Telegram Bot Started");
});
