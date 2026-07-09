require("dotenv").config();

module.exports = {
    // বটের টোকেন
    BOT_TOKEN: process.env.BOT_TOKEN,

    // ভেরিফিকেশন করার জন্য numeric ID (যেমন: -100123456789)
    CHANNEL_ID: process.env.CHANNEL_ID, 

    // জয়েন লিঙ্কের জন্য ইউজারনেম (যেমন: @YourChannel)
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME,

    // আপনার ওয়েব অ্যাপের লিঙ্ক
    WEBAPP_URL: process.env.WEBAPP_URL,

    // সার্ভারের পোর্ট
    PORT: process.env.PORT || 3000
};
