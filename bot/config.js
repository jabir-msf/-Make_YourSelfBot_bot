require("dotenv").config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CHANNEL_ID: process.env.CHANNEL_ID, // ইউজারনেমের বদলে আইডি ব্যবহার করছি
    WEBAPP_URL: process.env.WEBAPP_URL,
    PORT: process.env.PORT || 3000
};
