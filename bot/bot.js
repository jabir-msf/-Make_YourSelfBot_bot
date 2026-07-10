const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN } = require("./config");

// Handlers
const startHandler = require("./handlers/start");
const verifyHandler = require("./handlers/verify");
const adminHandler = require("./handlers/admin"); // অ্যাডমিন হ্যান্ডলার

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing. Add it to your .env file.");
}

// বটের ইন্সট্যান্স তৈরি
const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

// Register Handlers
startHandler(bot);      // /start কমান্ড এবং রেফারেল হ্যান্ডেল করবে
verifyHandler(bot);     // চ্যানেল জয়েন ভেরিফিকেশন হ্যান্ডেল করবে
adminHandler(bot);      // শুধুমাত্র আপনার জন্য /admin কমান্ড হ্যান্ডেল করবে

console.log("🤖 EarnBD Pro Bot Started Successfully!");

// এটি খুবই গুরুত্বপূর্ণ: যাতে server.js থেকে ব্রডকাস্ট করা যায়
module.exports = bot;
