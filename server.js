const express = require("express");
const path = require("path");
require("dotenv").config();
const supabase = require("./database/supabase"); // ডাটাবেস কানেকশন

// Start Telegram Bot
require("./bot/bot");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve WebApp Files
app.use(express.static(path.join(__dirname, "webapp")));

// --- API Routes ---

// ১. ইউজারের ডাটা পাওয়ার API
app.get("/api/user/:id", async (req, res) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.params.id)
        .single();
        
    if (error) return res.status(404).json({ error: "User not found" });
    res.json(data);
});

// ২. মাইনিং ক্লেইম করার API
app.post("/api/claim-mining", async (req, res) => {
    const { userId } = req.body;
    
    try {
        // ইউজারের বর্তমান ডাটা আনুন
        const { data: user, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const now = new Date();
        const lastClaim = new Date(user.last_claim);
        const secondsPassed = Math.floor((now - lastClaim) / 1000);
        
        // আয়ের হিসাব (সেকেন্ড * মাইনিং রেট)
        const earnings = secondsPassed * parseFloat(user.mining_rate);

        if (earnings <= 0) {
            return res.json({ success: false, message: "Claim করার মতো পর্যাপ্ত ব্যালেন্স নেই।" });
        }

        // ডাটাবেস আপডেট
        const { data: updatedUser, error: updateError } = await supabase
            .from('profiles')
            .update({
                balance: parseFloat(user.balance) + earnings,
                last_claim: now.toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({ success: true, balance: updatedUser.balance });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ৩. ডেইলি বোনাস API
app.post("/api/daily-bonus", async (req, res) => {
    const { userId } = req.body;
    
    try {
        const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();

        const now = new Date();
        const lastBonus = user.last_daily_bonus ? new Date(user.last_daily_bonus) : new Date(0);
        const diffInHours = (now - lastBonus) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            const waitTime = (24 - diffInHours).toFixed(1);
            return res.json({ success: false, message: `দুঃখিত! আরও ${waitTime} ঘণ্টা পর চেষ্টা করুন।` });
        }

        const bonusAmount = 5.00; // ডেইলি বোনাস ৫ পয়েন্ট
        const { data: updatedUser } = await supabase
            .from('profiles')
            .update({
                balance: parseFloat(user.balance) + bonusAmount,
                last_daily_bonus: now.toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        res.json({ success: true, balance: updatedUser.balance, message: `অভিনন্দন! আপনি ${bonusAmount} বোনাস পেয়েছেন।` });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ৫. উইথড্র হিস্ট্রি দেখার API
app.get("/api/withdrawals/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', req.params.id)
            .order('created_at', { ascending: false }); // নতুনগুলো আগে দেখাবে

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Data fetch failed" });
    }
});
// --- আগের কোড থাকবে ---

// নতুন API: কাজের ইতিহাস (Page 7 এর জন্য)
app.get("/api/tasks/history/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', req.params.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []); // ডাটা না থাকলে খালি অ্যারে পাঠাবে
    } catch (err) {
        res.status(500).json({ error: "Tasks fetch failed" });
    }
});

// ইউজারের রেফারেল পরিসংখ্যান পাওয়ার API (Page 4 এর জন্য)
app.get("/api/referrals/:id", async (req, res) => {
    try {
        const { data, count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('referrer_id', req.params.id);

        if (error) throw error;
        res.json({ total_refs: count || 0 });
    } catch (err) {
        res.status(500).json({ total_refs: 0 });
    }
});

// --- বাকি কোড যেমন আছে থাকবে ---
// --- Pages ---

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "webapp", "index.html"));
});
// ৪. উইথড্র রিকোয়েস্ট API
app.post("/api/withdraw", async (req, res) => {
    const { userId, method, accountNo, amount } = req.body;
    const withdrawAmount = parseFloat(amount);

    try {
        // ১. ইউজারের ব্যালেন্স চেক করা
        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        
        if (!user || user.balance < withdrawAmount) {
            return res.json({ success: false, message: "আপনার পর্যাপ্ত ব্যালেন্স নেই।" });
        }

        if (withdrawAmount < 100) {
            return res.json({ success: false, message: "ন্যূনতম ১০০ টাকা উত্তোলন করতে হবে।" });
        }

        // ২. ব্যালেন্স কাটা এবং রিকোয়েস্ট সেভ করা (Transaction)
        await supabase.from('profiles').update({ balance: user.balance - withdrawAmount }).eq('id', userId);
        
        const { error } = await supabase.from('withdrawals').insert({
            user_id: userId,
            amount: withdrawAmount,
            method: method,
            account_no: accountNo,
            status: 'pending'
        });

        if (error) throw error;

        res.json({ success: true, message: "আপনার উত্তোলনের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// Health Check
app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "online",
        app: "EarnBD-Pro",
        bot: "running"
    });
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log("🤖 Telegram Bot Started");
});
