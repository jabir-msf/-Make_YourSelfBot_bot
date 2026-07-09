const config = require("../config");

module.exports = (bot) => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;

        // সুরক্ষার জন্য চেক করা হচ্ছে ইউজারনেম আছে কিনা
        const channelUsername = config.CHANNEL_USERNAME || "";
        const cleanUsername = channelUsername.replace("@", "");

        // যদি ইউজারনেম সেট করা না থাকে তবে এরর মেসেজ দেবে, ক্র্যাশ করবে না
        if (!cleanUsername) {
            return bot.sendMessage(chatId, "⚠️ কনফিগারেশনে সমস্যা! চ্যানেল ইউজারনেম পাওয়া যায়নি।");
        }

        await bot.sendMessage(
            chatId,
            "🎉 Welcome to EarnBD Pro!\n\nপ্রথমে আমাদের অফিসিয়াল Telegram Channel-এ Join করুন।",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📢 Join Channel",
                                url: `https://t.me/${cleanUsername}`
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
