const config = require("../config");

module.exports = (bot) => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;

        // চেক করা হচ্ছে ইউজারনেম আছে কিনা
        const userFriendlyName = config.CHANNEL_USERNAME ? config.CHANNEL_USERNAME.replace("@", "") : "YourChannel";

        await bot.sendMessage(
            chatId,
            "🎉 Welcome to EarnBD Pro!\n\nপ্রথমে আমাদের অফিসিয়াল Telegram Channel-এ Join করুন।",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📢 Join Channel",
                                url: `https://t.me/${userFriendlyName}`
                            }
                        ],
                        [
                            {
                                text: "✅ Verify Join",
                                callback_data: "verify_join"
                            }
                        ]
                    ]
                }
            }
        );
    });
};
