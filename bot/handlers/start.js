const config = require("../config");
const supabase = require("../../database/supabase"); // ডাটাবেস কানেকশন ইমপোর্ট

module.exports = (bot) => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || "User";
        const username = msg.from.username || firstName;

        try {
            // ১. ডাটাবেসে ইউজারকে রেজিস্ট্রেশন বা আপডেট করা
            const { error } = await supabase.from('profiles').upsert({
                id: chatId,
                username: username,
                // প্রথমবার রেজিস্ট্রেশনের সময় ব্যালেন্স ও মাইনিং রেট ডাটাবেস স্কিমা থেকে অটো সেট হবে
            }, { onConflict: 'id' });

            if (error) {
                console.error("Database Error:", error.message);
            } else {
                console.log(`User ${chatId} registered/updated successfully.`);
            }

        } catch (err) {
            console.error("Critical Registration Error:", err.message);
        }

        // ২. জয়েন চ্যানেল এবং ভেরিফাই বাটন দেখানো
        const userFriendlyName = config.CHANNEL_USERNAME ? config.CHANNEL_USERNAME.replace("@", "") : "YourChannel";

        await bot.sendMessage(
            chatId,
            `🎉 Welcome ${firstName} to EarnBD Pro!\n\nআমাদের প্ল্যাটফর্মে কাজ শুরু করতে প্রথমে নিচের অফিসিয়াল Telegram Channel-এ Join করুন।`,
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
