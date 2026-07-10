const express = require("express");
const path = require("path");
require("dotenv").config();
const supabase = require("./database/supabase");

// Start Telegram Bot
// ব্রডকাস্টের জন্য বটের ইন্সট্যান্সটি ইমপোর্ট করা হলো
const bot = require("./bot/bot"); 

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve WebApp Files
app.use(express.static(path.join(__dirname, "webapp")));

// --- PUBLIC USER API ---

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

// --- EARNING & LIMIT API ---

// ৩. লিমিট চেক API (Strict Hourly Logic)
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
            return res.json({ 
                success: false, 
                message: `দুঃখিত! এই ঘণ্টার লিমিট (${limit}) শেষ। ১ ঘণ্টা পর চেষ্টা করুন।`,
                count: currentCount,
                limit: limit
            });
        }

        const { data: tasks } = await supabase.from('tasks').select('amount').eq('user_id', userId).eq('category', type).eq('status', 'pending');
        const pendingBalance = tasks ? tasks.reduce((sum, t) => sum + parseFloat(t.amount), 0) : 0;

        res.json({ success: true, count: currentCount, limit: limit, pending: pendingBalance.toFixed(2) });

    } catch (err) { res.status(500).json({ success: false }); }
});

// ৪. লিমিট ইনক্রিমেন্ট API (Security Added)
app.post("/api/earn/increment", async (req, res) => {
    const { userId, type } = req.body;
    const limit = type === 'ad' ? 20 : 15;
    const countCol = type === 'ad' ? 'ad_count' : 'vdo_count';

    try {
        const { data: user } = await supabase.from('profiles').select(countCol).eq('id', userId).single();
        const currentCount = parseInt(user[countCol] || 0);

        if (currentCount >= limit) {
            return res.json({ success: false, message: "Limit Exceeded" });
        }

        await supabase.from('profiles').update({ [countCol]: currentCount + 1 }).eq('id', userId);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// --- STATS & HISTORY API ---

// ৫. সেলিং পরিসংখ্যান (Stats) API
app.get("/api/user-stats/:userId/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('amount, status')
            .eq('user_id', req.params.userId)
            .eq('category', req.params.category);

        if (error) throw error;
        const approved = data ? data.filter(t => t.status === 'approved') : [];
        res.json({ totalSold: approved.length, totalEarned: approved.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) });
    } catch (err) { res.json({ totalSold: 0, totalEarned: 0 }); }
});

// ৬. অ্যাডমিন সেট করা টাস্ক লিস্ট ও পাসওয়ার্ড API
app.get("/api/admin-tasks/:category", async (req, res) => {
    try {
        const { data, error } = await supabase.from('admin_tasks').select('*').eq('category', req.params.category);
        res.json(data || []);
    } catch (err) { res.json([]); }
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
    } catch (err) { res.json({ total_refs: 0 }); }
});

// --- WITHDRAW API ---

// ৯. উইথড্র রিকোয়েস্ট API
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
        await supabase.from('withdrawals').insert({ user_id: userId, amount: withdrawAmount, method, account_no: accountNo, status: 'pending' });

        res.json({ success: true, message: "আপনার উত্তোলনের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।" });
    } catch (err) { res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" }); }
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

// ১০. সব পেন্ডিং টাস্ক দেখা (profiles এর সাথে join করা)
app.get("/api/admin/pending-tasks", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select(`*, profiles:user_id (username)`)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) { 
        console.error("Admin Fetch Error:", err);
        res.status(500).json([]); 
    }
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

// ১৩. সব পেন্ডিং উইথড্র দেখা (Admin Panel এর জন্য)
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

// ১৪. উইথড্র অ্যাকশন (Approve বা Cancel/Refund)
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

// ১৫. নতুন অ্যাডমিন টাস্ক যোগ করা
app.post("/api/admin/add-task", async (req, res) => {
    const { title, reward, category, pass } = req.body;
    try {
        const { error } = await supabase.from('admin_tasks').insert({
            title: title,
            reward: parseFloat(reward),
            category: category,
            daily_password: pass || null
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

// ১৮. ইউজারের ব্যালেন্স সরাসরি এডিট
app.post("/api/admin/update-balance", async (req, res) => {
    const { userId, amount } = req.body;
    try {
        await supabase.from('profiles').update({ balance: parseFloat(amount) }).eq('id', userId);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
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

// ২০. ব্রডকাস্টিং (বট মেসেজ) API
app.post("/api/admin/broadcast", async (req, res) => {
    const { message } = req.body;
    try {
        const { data: users } = await supabase.from('profiles').select('id');
        if (!users) return res.json({ success: false });

        users.forEach((u, index) => {
            // টেলিগ্রাম ফ্লাড লিমিট এড়াতে প্রতি মেসেজের মাঝে ৫০ মিলিসেকেন্ড গ্যাপ
            setTimeout(() => {
                if (bot && typeof bot.sendMessage === 'function') {
                    bot.sendMessage(u.id, `📢 **নতুন নোটিশ:**\n\n${message}`, { parse_mode: 'Markdown' })
                        .catch(e => console.log(`Error sending to ${u.id}`));
                }
            }, index * 50);
        });
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// Root & Health Check
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.get("/health", (req, res) => res.json({ status: "online", app: "EarnBD-Pro" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
