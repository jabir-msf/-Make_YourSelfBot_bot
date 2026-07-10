const express = require("express");
const path = require("path");
require("dotenv").config();
const supabase = require("./database/supabase");

// Start Telegram Bot
require("./bot/bot");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve WebApp Files
app.use(express.static(path.join(__dirname, "webapp")));

// --- API Routes ---

// ১. ইউজারের প্রোফাইল ডাটা পাওয়ার API
app.get("/api/user/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error || !data) return res.status(404).json({ error: "User not found" });
        data.balance = parseFloat(data.balance || 0);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ২. অ্যাডমিনদের সেট করা টাস্ক লিস্ট পাওয়ার API (Category অনুযায়ী)
app.get("/api/admin-tasks/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('admin_tasks')
            .select('*')
            .eq('category', req.params.category);
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

// ৩. টাস্ক সাবমিট করার API (স্ক্রিনশট URL ও ক্যাটাগরি সহ)
app.post("/api/tasks/submit", async (req, res) => {
    const { userId, taskName, amount, category, proofUrl } = req.body;
    try {
        const { error } = await supabase.from('tasks').insert({
            user_id: userId,
            task_name: taskName,
            amount: parseFloat(amount),
            category: category,
            proof_url: proofUrl, // স্ক্রিনশট লিঙ্ক
            status: 'pending'
        });

        if (error) throw error;
        res.json({ success: true, message: "কাজটি জমা হয়েছে! এডমিন চেক করে এপ্রুভ করলে টাকা যোগ হবে।" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "টাস্ক জমা দিতে সমস্যা হয়েছে।" });
    }
});

// ৪. অ্যাড এবং ভিডিও লিমিট চেক ও কাউন্ট করার API
app.post("/api/earn/limit-check", async (req, res) => {
    const { userId, type } = req.body; // type: 'ad' or 'video'
    const limit = type === 'ad' ? 20 : 15;
    const countCol = type === 'ad' ? 'ad_count' : 'vdo_count';
    const resetCol = type === 'ad' ? 'last_ad_reset' : 'last_vdo_reset';

    try {
        const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!user) return res.status(404).json({ success: false });

        const now = new Date();
        const lastReset = user[resetCol] ? new Date(user[resetCol]) : new Date(0);
        const diffHours = (now - lastReset) / (1000 * 60 * 60);

        let currentCount = user[countCol] || 0;

        // ১ ঘণ্টা পার হয়ে গেলে অটো রিসেট
        if (diffHours >= 1) {
            currentCount = 0;
            await supabase.from('profiles').update({ 
                [countCol]: 0, 
                [resetCol]: now.toISOString() 
            }).eq('id', userId);
        }

        if (currentCount >= limit) {
            return res.json({ 
                success: false, 
                message: `দুঃখিত! আপনি এই ঘণ্টায় সর্বোচ্চ লিমিট (${limit}) শেষ করেছেন।` 
            });
            // ক্যাটাগরি অনুযায়ী ইউজারের সেলিং পরিসংখ্যান (Stats)
app.get("/api/user-stats/:userId/:category", async (req, res) => {
    const { userId, category } = req.params;
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('amount, status')
            .eq('user_id', userId)
            .eq('category', category);

        if (error) throw error;

        const approvedTasks = data.filter(t => t.status === 'approved');
        const totalSold = approvedTasks.length;
        const totalEarned = approvedTasks.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        res.json({ totalSold, totalEarned });
    } catch (err) {
        res.status(500).json({ totalSold: 0, totalEarned: 0 });
    }
});
        }

        // লিমিট ওকে থাকলে ১ বাড়িয়ে দিবে
        await supabase.from('profiles').update({ [countCol]: currentCount + 1 }).eq('id', userId);
        res.json({ success: true, remaining: limit - (currentCount + 1) });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// ৫. উইথড্র রিকোয়েস্ট API
app.post("/api/withdraw", async (req, res) => {
    const { userId, method, accountNo, amount } = req.body;
    const withdrawAmount = parseFloat(amount);

    try {
        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        
        if (!user || parseFloat(user.balance) < withdrawAmount) {
            return res.json({ success: false, message: "আপনার পর্যাপ্ত ব্যালেন্স নেই।" });
        }
        if (withdrawAmount < 100) {
            return res.json({ success: false, message: "ন্যূনতম ১০০ টাকা উত্তোলন করতে হবে।" });
        }

        const newBalance = parseFloat(user.balance) - withdrawAmount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        
        await supabase.from('withdrawals').insert({
            user_id: userId, amount: withdrawAmount, method, account_no: accountNo, status: 'pending'
        });

        res.json({ success: true, message: "আপনার উত্তোলনের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।" });
    } catch (err) {
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// ৬. হিস্ট্রি বা ইতিহাস API (Withdraw & Tasks)
app.get("/api/withdrawals/:id", async (req, res) => {
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

app.get("/api/tasks/history/:id", async (req, res) => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

// ৭. রেফারেল পরিসংখ্যান API
app.get("/api/referrals/:id", async (req, res) => {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referrer_id', req.params.id);
    res.json({ total_refs: count || 0 });
});

// Root & Health Check
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.get("/health", (req, res) => res.json({ status: "online", app: "EarnBD-Pro" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
