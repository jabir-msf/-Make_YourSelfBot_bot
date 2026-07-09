const { CHANNEL_USERNAME, WEBAPP_URL } = require("../config");

module.exports = (bot) => {
    bot.on("callback_query", async (query) => {

        if (query.data !== "verify_join") return;
        console.log("VERIFY BUTTON CLICKED", query.from.id);

        const chatId = query.message.chat.id;
        const userId = query.from.id;

        try {
            const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
            console.log("MEMBER STATUS:", member);

            if (["creator", "administrator", "member"].includes(member.status)) {

                await bot.editMessageText(
                    "✅ Verification Successful!\n\nআপনি সফলভাবে Channel Join করেছেন।",
                    {
                        chat_id: chatId,
                        message_id: query.message.message_id,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🚀 Open App",
                                        web_app: {
                                            url: WEBAPP_URL
                                        }
                                    }
                                ]
                            ]
                        }
                    }
                );

            } else {

                await bot.answerCallbackQuery(query.id, {
                    text: "❌ আগে Channel Join করুন।",
                    show_alert: true
                });

            }

        } catch (err) {

    console.log("VERIFY ERROR:", err.response?.body || err.message);

    await bot.answerCallbackQuery(query.id, {
        text: "❌ Join যাচাই করা যায়নি।",
        show_alert: true
    });

                    }

        

    });
};
