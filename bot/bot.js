const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN } = require("./config");

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing. Add it to your .env file.");
}

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "🎉 Welcome to EarnBD Pro!\n\nপ্রথমে আমাদের অফিসিয়াল চ্যানেলে যোগ দিন।"
    );
});

console.log("🤖 Bot Started");
