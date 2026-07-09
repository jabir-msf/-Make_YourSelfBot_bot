const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN } = require("./config");

// Handlers
const startHandler = require("./handlers/start");

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing. Add it to your .env file.");
}

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

// Register Handlers
startHandler(bot);

console.log("🤖 EarnBD Pro Bot Started Successfully!");
