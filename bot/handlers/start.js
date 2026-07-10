const config = require("../config");
const supabase = require("../../database/supabase");

module.exports = (bot) => {
    // /start এবং /start 12345 দুটাই হ্যান্ডেল করবে
    bot.onText(/\/start ?(.+)?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || "User";
        const username = msg.from.username || firstName;
        const refId = match[1]; // রেফারেল আইডি ধরবে

        try {
            // ১. চেক করা ইউজার আগে থেকে আছে কি না
            const { data: userExists } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', chatId)
                .single();

            if (!userExists) {
                // নতুন ইউজার হলে ডাটাবেসে ইনসার্ট করা
                await supabase.from('profiles').insert({
                    id: chatId,
                    username: username,
                    balance: 0.00,
                    mining_rate: 0.0001, // ডিফল্ট মাইনিং স্পিড
                    referrer_id: refId ? parseInt(refId) : null, // রেফারেল থাকলে সেভ হবে
                    last_claim: new Date().toISOString()
                });
                console.log(`New user ${chatId} registered via referral: ${refId || 'None'}`);
            } else {
                // পুরাতন ইউজার হলে ইউজারনেম আপডেট করা (অপশনাল)
                await supabase.from('profiles').update({ username: username }).eq('id', chatId);
            }

        } catch (err) {
            console.error("Critical Registration Error:", err.message);
        }

        const userFriendlyName = config.CHANNEL_USERNAME ? config.CHANNEL_USERNAME.replace("@", "") : "YourChannel";

        await bot.sendMessage(
            chatId,
            `🎉 Welcome ${firstName} to EarnBD Pro!\n\nআমাদের প্ল্যাটফর্মে কাজ শুরু করতে প্রথমে নিচের Telegram Channel-এ Join করুন।`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📢 Join Channel", url: `https://t.me/${userFriendlyName}` }],
                        [{ text: "✅ Verify Join", callback_data: "verify_join" }]
                    ]
                }
            }
        );
    });
};
