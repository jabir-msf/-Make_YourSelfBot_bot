const { CHANNEL_USERNAME } = require("../config");

module.exports = (bot) => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;

        bot.sendMessage(
            chatId,
            "🎉 Welcome to EarnBD Pro!\n\nপ্রথমে আমাদের অফিসিয়াল চ্যানেলে Join করুন।",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📢 Join Channel",
                                url: `https://t.me/${CHANNEL_USERNAME.replace("@", "")}`
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
