require("dotenv").config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CHANNEL_ID: process.env.CHANNEL_ID,
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME || "", // ফাকা থাকলে ক্র্যাশ করবে না
    WEBAPP_URL: process.env.WEBAPP_URL,
    PORT: process.env.PORT || 3000
};
