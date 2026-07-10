const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN } = require("./config");

// Handlers
const startHandler = require("./handlers/start");
const verifyHandler = require("./handlers/verify");
const adminHandler = require("./handlers/admin"); // নতুন অ্যাডমিন হ্যান্ডলার যোগ করা হলো

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing. Add it to your .env file.");
}

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

// Register Handlers
startHandler(bot);      // /start কমান্ড এবং রেফারেল হ্যান্ডেল করবে
verifyHandler(bot);     // চ্যানেল জয়েন ভেরিফিকেশন হ্যান্ডেল করবে
adminHandler(bot);      // শুধুমাত্র আপনার জন্য /admin কমান্ড হ্যান্ডেল করবে

console.log("🤖 EarnBD Pro Bot Started Successfully!");
