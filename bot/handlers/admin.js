const config = require("../config");
// আপনার অনুমোদিত এডমিন আইডি সমূহ
const ADMIN_IDS = [8144639897, 8590950777]; 

module.exports = (bot) => {
    bot.onText(/\/admin/, async (msg) => {
        const chatId = msg.chat.id;

        // chatId এবং এডমিন আইডি সমূহকে Number-এ কনভার্ট করে টাইপ-সেফ চেক করা হচ্ছে
        if (!ADMIN_IDS.map(Number).includes(Number(chatId))) {
            return bot.sendMessage(chatId, "❌ আপনি এই কমান্ডটি ব্যবহারের অনুমতি নেই।");
        }

        const adminUrl = config.WEBAPP_URL + "/admin.html";

        await bot.sendMessage(
            chatId,
            `👋 স্বাগতম অ্যাডমিন!\n\nআপনার কন্ট্রোল প্যানেলে প্রবেশ করতে নিচের বাটনে ক্লিক করুন।`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { 
                                text: "🛠 ওপেন অ্যাডমিন প্যানেল", 
                                web_app: { url: adminUrl } 
                            }
                        ]
                    ]
                }
            }
        );
    });
};
