require("dotenv").config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME,
    WEBAPP_URL: process.env.WEBAPP_URL,
    PORT: process.env.PORT || 3000
};
