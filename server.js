const express = require("express");
const path = require("path");
require("dotenv").config();
const supabase = require("./database/supabase");

// Start Telegram Bot
const bot = require("./bot/bot"); 

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve WebApp Files
app.use(express.static(path.join(__dirname, "webapp")));

// --- SETTINGS SYNC API (For Users) ---
// ইউজাররা যাতে এডমিন প্যানেলের মিনিমাম উইথড্র দেখতে পায়
app.get("/api/settings", async (req, res) => {
    try {
        const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
        res.json(data || { min_withdraw: 100, ref_bonus: 20 });
    } catch (e) { res.json({ min_withdraw: 100, ref_bonus: 20 }); }
});

// --- PUBLIC USER API ---

// ১. ইউজারের প্রোফাইল ডাটা পাওয়ার API (ব্যান চেক সহ)
app.get("/api/user/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error || !data) {
            return res.status(404).json({ error: "User not found" });
        }

        // ইউজার যদি ব্যান থাকে
        if (data.is_banned) {
            return res.status(403).json({ error: "Your account is banned!", banned: true });
        }
        
        data.balance = parseFloat(data.balance || 0);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ২. টাস্ক সাবমিট API
app.post("/api/tasks/submit", async (req, res) => {
    const { userId, taskName, amount, category, proofUrl } = req.body;
    try {
        const { error } = await supabase.from('tasks').insert({
            user_id: userId,
            task_name: taskName,
            amount: parseFloat(amount || 0),
            category: category || 'general',
            proof_url: proofUrl || 'No Proof Provided',
            status: 'pending'
        });

        if (error) throw error;
        res.json({ success: true, message: "সফলভাবে জমা হয়েছে! এডমিন চেক করবে।" });
    } catch (err) {
        console.error("Task Submit Error:", err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// --- EARNING & LIMIT API --- (আগের মতোই রাখা হয়েছে)
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
        const diffHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        let currentCount = parseInt(user[countCol] || 0);
        if (diffHours >= 1) {
            currentCount = 0;
            await supabase.from('profiles').update({ [countCol]: 0, [resetCol]: now.toISOString() }).eq('id', userId);
        }

        if (currentCount >= limit) {
            return res.json({ success: false, message: `লিমিট শেষ। ১ ঘণ্টা পর চেষ্টা করুন।`, count: currentCount, limit: limit });
        }

        const { data: tasks } = await supabase.from('tasks').select('amount').eq('user_id', userId).eq('category', type).eq('status', 'pending');
        const pendingBalance = tasks ? tasks.reduce((sum, t) => sum + parseFloat(t.amount), 0) : 0;
        res.json({ success: true, count: currentCount, limit: limit, pending: pendingBalance.toFixed(2) });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/earn/increment", async (req, res) => {
    const { userId, type } = req.body;
    const countCol = type === 'ad' ? 'ad_count' : 'vdo_count';
    try {
        const { data: user } = await supabase.from('profiles').select(countCol).eq('id', userId).single();
        await supabase.from('profiles').update({ [countCol]: parseInt(user[countCol] || 0) + 1 }).eq('id', userId);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// --- ADMIN CONTROL API (MEGA UPDATED) ---

// ১৬. অ্যাডমিন ড্যাশবোর্ড পরিসংখ্যান (Stats)
app.get("/api/admin/stats", async (req, res) => {
    try {
        const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        const { data: balances } = await supabase.from('profiles').select('balance');
        const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);
        
        const { count: pendingTasks } = await supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingWithdrawals } = await supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending');

        res.json({ totalUsers, totalBalance, pendingTasks, pendingWithdrawals });
    } catch (err) { res.status(500).json({ error: "Failed to fetch stats" }); }
});

// ১০. সব পেন্ডিং টাস্ক দেখা
app.get("/api/admin/pending-tasks", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select(`*, profiles:user_id (username)`)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json([]); }
});

// ১১. টাস্ক এপ্রুভ ও ব্যালেন্স যোগ
app.post("/api/admin/approve-task", async (req, res) => {
    const { taskId, userId, amount } = req.body;
    try {
        await supabase.from('tasks').update({ status: 'approved' }).eq('id', taskId);
        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        const newBalance = parseFloat(user.balance || 0) + parseFloat(amount);
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// ১২. টাস্ক রিজেক্ট
app.post("/api/admin/reject-task", async (req, res) => {
    const { taskId } = req.body;
    try {
        await supabase.from('tasks').update({ status: 'rejected' }).eq('id', taskId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// ১৩. সব পেন্ডিং উইথড্র দেখা
app.get("/api/admin/pending-withdrawals", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*, profiles:user_id(username)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json([]); }
});

// ১৪. উইথড্র অ্যাকশন (Dynamic Min Withdraw Check সহ)
app.post("/api/admin/action-withdraw", async (req, res) => {
    const { id, type, userId, amount } = req.body;
    try {
        if (type === 'approve') {
            await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
        } else {
            const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            const newBalance = parseFloat(user.balance || 0) + parseFloat(amount);
            await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
            await supabase.from('withdrawals').update({ status: 'cancelled' }).eq('id', id);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// ১৫. নতুন অ্যাডমিন টাস্ক যোগ করা (Daily Password সহ)
app.post("/api/admin/add-task", async (req, res) => {
    const { title, reward, category, pass } = req.body;
    try {
        const { error } = await supabase.from('admin_tasks').insert({
            title: title, reward: parseFloat(reward), category: category, daily_password: pass || null
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// ১৭. ইউজার সার্চ API
app.get("/api/admin/user-search/:query", async (req, res) => {
    const q = req.params.query;
    try {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .or(`id.eq.${isNaN(q) ? 0 : q},username.ilike.%${q}%`);
        res.json(data || []);
    } catch (err) { res.json([]); }
});

// ২১. ইউজার ব্যান/আনব্যান API (নতুন যোগ করা হলো)
app.post("/api/admin/ban-user", async (req, res) => {
    const { userId, status } = req.body;
    try {
        await supabase.from('profiles').update({ is_banned: status }).eq('id', userId);
        res.json({ success: true, message: status ? "User Banned" : "User Unbanned" });
    } catch (err) { res.json({ success: false }); }
});

// ১৮. ইউজারের ব্যালেন্স এডিট
app.post("/api/admin/update-balance", async (req, res) => {
    const { userId, amount } = req.body;
    try {
        await supabase.from('profiles').update({ balance: parseFloat(amount) }).eq('id', userId);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// ৭. রেফারেল হিস্ট্রি (কার রেফারে কে জয়েন করেছে)
app.get("/api/admin/ref-history", async (req, res) => {
    try {
        const { data } = await supabase
            .from('profiles')
            .select('id, username, referrer_id, created_at')
            .not('referrer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
        res.json(data || []);
    } catch (err) { res.json([]); }
});

// ১৯. গ্লোবাল সেটিংস কন্ট্রোল API
app.get("/api/admin/get-settings", async (req, res) => {
    try {
        const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
        res.json(data || {});
    } catch (err) { res.json({}); }
});

app.post("/api/admin/update-settings", async (req, res) => {
    const { min, ref, notice } = req.body;
    try {
        await supabase.from('settings').update({ min_withdraw: min, ref_bonus: ref, app_notice: notice }).eq('id', 1);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// ৯. উইথড্র রিকোয়েস্ট (ইউজার সাইড) - সেটিংস সিঙ্ক সহ
app.post("/api/withdraw", async (req, res) => {
    const { userId, method, accountNo, amount } = req.body;
    const withdrawAmount = parseFloat(amount);
    try {
        const { data: settings } = await supabase.from('settings').select('min_withdraw').eq('id', 1).single();
        const minAmount = settings ? parseFloat(settings.min_withdraw) : 100;

        if (withdrawAmount < minAmount) {
            return res.json({ success: false, message: `ন্যূনতম ৳${minAmount} উত্তোলন করতে হবে।` });
        }

        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (!user || parseFloat(user.balance) < withdrawAmount) {
            return res.json({ success: false, message: "পর্যাপ্ত ব্যালেন্স নেই।" });
        }

        const newBalance = parseFloat(user.balance) - withdrawAmount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        await supabase.from('withdrawals').insert({ user_id: userId, amount: withdrawAmount, method, account_no: accountNo, status: 'pending' });

        res.json({ success: true, message: "আপনার উত্তোলনের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// Root & Health Check
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.get("/health", (req, res) => res.json({ status: "online", app: "EarnBD-Pro" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
