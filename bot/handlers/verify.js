const { CHANNEL_ID, WEBAPP_URL } = require("../config");

module.exports = (bot) => {
    bot.on("callback_query", async (query) => {
        if (query.data !== "verify_join") return;

        const chatId = query.message.chat.id;
        const userId = query.from.id;

        try {
            const member = await bot.getChatMember(CHANNEL_ID, userId);
            
            if (["creator", "administrator", "member"].includes(member.status)) {
                await bot.editMessageText(
                    "✅ Verification Successful!\n\nএখন আপনি অ্যাপটি ব্যবহার করতে পারবেন।",
                    {
                        chat_id: chatId,
                        message_id: query.message.message_id,
                        reply_markup: {
                            inline_keyboard: [[{ text: "🚀 Open App", web_app: { url: WEBAPP_URL } }]]
                        }
                    }
                );
            } else {
                await bot.answerCallbackQuery(query.id, {
                    text: "❌ আপনি এখনো চ্যানেলে জয়েন করেননি!",
                    show_alert: true
                });
            }
        } catch (err) {
            console.error("VERIFY ERROR:", err);
            // এখানে মেসেজটি সহজ করে দেওয়া হলো যাতে ইউজার কনফিউজ না হয়
            await bot.answerCallbackQuery(query.id, {
                text: "❌ কারিগরি ত্রুটি! অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন বা চ্যানেল আইডি চেক করুন।",
                show_alert: true
            });
        }
    });
};
