const express = require("express");
const path = require("path");
require("dotenv").config();
const supabase = require("./database/supabase");
require("./bot/bot");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "webapp")));

// ১. ইউজার ডাটা API
app.get("/api/user/:id", async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ error: "User not found" });
        data.balance = parseFloat(data.balance || 0);
        res.json(data);
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// ২. টাস্ক সাবমিট API (Fix: Category and Proof Handling)
app.post("/api/tasks/submit", async (req, res) => {
    const { userId, taskName, amount, category, proofUrl } = req.body;
    try {
        const { error } = await supabase.from('tasks').insert({
            user_id: userId,
            task_name: taskName,
            amount: parseFloat(amount),
            category: category || 'general',
            proof_url: proofUrl || 'No Proof',
            status: 'pending'
        });
        if (error) throw error;
        res.json({ success: true, message: "সফলভাবে জমা হয়েছে! এডমিন চেক করবে।" });
    } catch (err) {
        console.error("Submit Error:", err);
        res.status(500).json({ success: false, message: "জমা দিতে সমস্যা হয়েছে।" });
    }
});

// ৩. লিমিট চেক API (Fix: Strict Hourly Logic)
app.post("/api/earn/limit-check", async (req, res) => {
    const { userId, type } = req.body;
    const limit = type === 'ad' ? 20 : 15;
    const countCol = type === 'ad' ? 'ad_count' : 'vdo_count';
    const resetCol = type === 'ad' ? 'last_ad_reset' : 'last_vdo_reset';

    try {
        const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!user) return res.status(404).json({ success: false });

        const now = new Date();
        const lastReset = user[resetCol] ? new Date(user[resetCol]) : new Date(0);
        const diffInMs = now.getTime() - lastReset.getTime();
        const diffHours = diffInMs / (1000 * 60 * 60);

        let currentCount = user[countCol] || 0;

        if (diffHours >= 1) {
            currentCount = 0;
            await supabase.from('profiles').update({ [countCol]: 0, [resetCol]: now.toISOString() }).eq('id', userId);
        }

        if (currentCount >= limit) {
            return res.json({ success: false, message: `এই ঘণ্টার লিমিট (${limit}) শেষ। ১ ঘণ্টা পর চেষ্টা করুন।` });
        }

        // লিমিট ওকে থাকলে ১ বাড়িয়ে দিবে এবং আপডেট করবে
        await supabase.from('profiles').update({ [countCol]: currentCount + 1 }).eq('id', userId);
        res.json({ success: true, remaining: limit - (currentCount + 1) });

    } catch (err) { res.status(500).json({ success: false }); }
});

// ৪. স্ট্যাটাস ও ইতিহাস API
app.get("/api/user-stats/:userId/:category", async (req, res) => {
    try {
        const { data } = await supabase.from('tasks').select('amount, status').eq('user_id', req.params.userId).eq('category', req.params.category);
        const approved = data ? data.filter(t => t.status === 'approved') : [];
        const totalSold = approved.length;
        const totalEarned = approved.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        res.json({ totalSold, totalEarned });
    } catch (err) { res.json({ totalSold: 0, totalEarned: 0 }); }
});

// ৫. অ্যাডমিন টাস্ক ও পাসওয়ার্ড API
app.get("/api/admin-tasks/:category", async (req, res) => {
    const { data } = await supabase.from('admin_tasks').select('*').eq('category', req.params.category);
    res.json(data || []);
});

// ৬. উইথড্র ও অন্যান্য API (আগের মতোই থাকবে)
app.post("/api/withdraw", async (req, res) => {
    const { userId, method, accountNo, amount } = req.body;
    try {
        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (!user || user.balance < amount) return res.json({ success: false, message: "ব্যালেন্স কম।" });
        await supabase.from('profiles').update({ balance: user.balance - amount }).eq('id', userId);
        await supabase.from('withdrawals').insert({ user_id: userId, amount, method, account_no: accountNo, status: 'pending' });
        res.json({ success: true, message: "অনুরোধ গৃহীত হয়েছে।" });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/api/withdrawals/:id", async (req, res) => {
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});
app.get("/api/tasks/history/:id", async (req, res) => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.listen(process.env.PORT || 3000, () => console.log("Server running..."));
