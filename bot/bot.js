const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN } = require("./config");

// Handlers
const startHandler = require("./handlers/start");
const verifyHandler = require("./handlers/verify");

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing. Add it to your .env file.");
}

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

// Register Handlers
startHandler(bot);
verifyHandler(bot);

console.log("🤖 EarnBD Pro Bot Started Successfully!");
