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
            
        if (error || !data) {
            console.error("User Fetch Error:", error);
            return res.status(404).json({ error: "User not found" });
        }
        
        data.balance = parseFloat(data.balance || 0);
        res.json(data);
    } catch (err) {
        console.error("Server Crash on User Fetch:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ২. টাস্ক সাবমিট API (Proof URL ও Category হ্যান্ডলিং সহ)
app.post("/api/tasks/submit", async (req, res) => {
    const { userId, taskName, amount, category, proofUrl } = req.body;
    console.log(`Task Submission Attempt: User ${userId}, Task ${taskName}`);

    try {
        const { error } = await supabase.from('tasks').insert({
            user_id: userId,
            task_name: taskName,
            amount: parseFloat(amount || 0),
            category: category || 'general',
            proof_url: proofUrl || 'No Proof Provided',
            status: 'pending'
        });

        if (error) {
            console.error("Supabase Task Insert Error:", error.message);
            return res.status(500).json({ success: false, message: "ডাটাবেসে সেভ হতে সমস্যা হয়েছে।" });
        }

        res.json({ success: true, message: "সফলভাবে জমা হয়েছে! এডমিন চেক করবে।" });
    } catch (err) {
        console.error("Critical Task Submit Error:", err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// ৩. লিমিট চেক ও ইনক্রিমেন্ট API (Final Fixed)
app.post("/api/earn/limit-check", async (req, res) => {
    const { userId, type } = req.body;
    const limit = type === 'ad' ? 20 : 15;
    const countCol = type === 'ad' ? 'ad_count' : 'vdo_count';
    const resetCol = type === 'ad' ? 'last_ad_reset' : 'last_vdo_reset';

    try {
        const { data: user, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error || !user) return res.status(404).json({ success: false });

        const now = new Date();
        const lastReset = user[resetCol] ? new Date(user[resetCol]) : new Date(0);
        
        // সময়ের পার্থক্য বের করা (মিলি-সেকেন্ডে)
        const diffMs = now.getTime() - lastReset.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        let currentCount = parseInt(user[countCol]) || 0;

        // ১ ঘণ্টা পার হয়ে গেলে রিসেট হবে
        if (diffHours >= 1) {
            currentCount = 0;
            // ডাটাবেসে রিসেট আপডেট
            await supabase.from('profiles').update({ 
                [countCol]: 1, // প্রথম কাজ হিসেবে ১ ধরবে
                [resetCol]: now.toISOString() 
            }).eq('id', userId);
            
            return res.json({ success: true, remaining: limit - 1 });
        }

        // লিমিট চেক
        if (currentCount >= limit) {
            return res.json({ 
                success: false, 
                message: `দুঃখিত! আপনি এই ঘণ্টার লিমিট (${limit}) শেষ করেছেন। ১ ঘণ্টা পর আবার চেষ্টা করুন।` 
            });
        }

        // লিমিট ওকে থাকলে ১ বাড়িয়ে আপডেট করা
        const newCount = currentCount + 1;
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ [countCol]: newCount })
            .eq('id', userId);

        if(updateError) throw updateError;

        res.json({ success: true, remaining: limit - newCount });

    } catch (err) {
        console.error("Limit API Error:", err);
        res.status(500).json({ success: false });
    }
});
// ৪. ইউজারের সেলিং পরিসংখ্যান (Stats) API
app.get("/api/user-stats/:userId/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('amount, status')
            .eq('user_id', req.params.userId)
            .eq('category', req.params.category);

        if (error) throw error;

        const approved = data ? data.filter(t => t.status === 'approved') : [];
        const totalSold = approved.length;
        const totalEarned = approved.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        res.json({ totalSold, totalEarned });
    } catch (err) {
        res.json({ totalSold: 0, totalEarned: 0 });
    }
});

// ৫. অ্যাডমিন টাস্ক ও পাসওয়ার্ড API
app.get("/api/admin-tasks/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('admin_tasks')
            .select('*')
            .eq('category', req.params.category);
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.json([]);
    }
});

// ৬. উইথড্র রিকোয়েস্ট API
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

        // ব্যালেন্স কাটা এবং রিকোয়েস্ট সেভ
        const newBalance = parseFloat(user.balance) - withdrawAmount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        
        await supabase.from('withdrawals').insert({
            user_id: userId, amount: withdrawAmount, method, account_no: accountNo, status: 'pending'
        });

        res.json({ success: true, message: "আপনার উত্তোলনের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।" });
    } catch (err) {
        console.error("Withdraw Error:", err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// ৭. ইতিহাস API (Withdraw & Tasks)
app.get("/api/withdrawals/:id", async (req, res) => {
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

app.get("/api/tasks/history/:id", async (req, res) => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

// ৮. রেফারেল পরিসংখ্যান
app.get("/api/referrals/:id", async (req, res) => {
    try {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referrer_id', req.params.id);
        res.json({ total_refs: count || 0 });
    } catch (err) {
        res.json({ total_refs: 0 });
    }
});

// Root & Health Check
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.get("/health", (req, res) => res.json({ status: "online", app: "EarnBD-Pro" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
