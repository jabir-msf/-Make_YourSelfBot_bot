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

// ১. ইউজারের ডাটা পাওয়ার API
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

// ২. টাস্ক সাবমিট করার API (নতুন)
app.post("/api/tasks/submit", async (req, res) => {
    const { userId, taskName, amount } = req.body;
    try {
        const { error } = await supabase.from('tasks').insert({
            user_id: userId,
            task_name: taskName,
            amount: parseFloat(amount),
            status: 'pending'
        });

        if (error) throw error;
        res.json({ success: true, message: "কাজটি জমা হয়েছে! এডমিন চেক করে এপ্রুভ করলে টাকা যোগ হবে।" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// ৩. উইথড্র রিকোয়েস্ট API
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
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// ৪. ইতিহাস দেখার API সমূহ
app.get("/api/withdrawals/:id", async (req, res) => {
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

app.get("/api/tasks/history/:id", async (req, res) => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', req.params.id).order('created_at', { ascending: false });
    res.json(data || []);
});

// ৫. রেফারেল পরিসংখ্যান
app.get("/api/referrals/:id", async (req, res) => {
    try {
        const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referrer_id', req.params.id);
        res.json({ total_refs: count || 0 });
    } catch (err) {
        res.json({ total_refs: 0 });
    }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.get("/health", (req, res) => res.json({ status: "online" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
