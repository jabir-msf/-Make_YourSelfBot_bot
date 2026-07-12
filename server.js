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
app.get("/api/settings", async (req, res) => {
    try {
        const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
        res.json(data || { min_withdraw: 100, ref_bonus: 20 });
    } catch (e) { res.json({ min_withdraw: 100, ref_bonus: 20 }); }
});

// --- PUBLIC USER API ---
app.get("/api/user/:id", async (req, res) => {
    try {
        let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error || !data) {
            const { data: newUser, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: req.params.id,
                    username: "User",
                    balance: 0.00,
                    mining_rate: 0.0001,
                    tier: 'সিলভার'
                })
                .select('*')
                .single();
            
            if (insertError) {
                return res.status(404).json({ error: "User not found and creation failed" });
            }
            data = newUser;
        }

        if (data.is_banned) {
            return res.status(403).json({ error: "Your account is banned!", banned: true });
        }
        
        data.balance = parseFloat(data.balance || 0);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

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
app.post("/api/earn/limit-check", async (req, res) => {
    const { userId, type } = req.body;
    const limit = type === 'ad' ? 20 : 10; 
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

// --- ADMIN CONTROL API ---
app.get("/api/admin/stats", async (req, res) => {
    try {
        const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        const { count: pendingTasks } = await supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingWithdrawals } = await supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingDeposits } = await supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        
        const { data: approvedTasks } = await supabase.from('tasks').select('amount').eq('status', 'approved');
        const totalTaskPaid = approvedTasks ? approvedTasks.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) : 0;
        
        const { data: approvedWithdrawals } = await supabase.from('withdrawals').select('amount').eq('status', 'approved');
        const totalWithdrawnAmount = approvedWithdrawals ? approvedWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) : 0;

        res.json({ 
            totalUsers: totalUsers || 0, 
            pendingTasks: pendingTasks || 0, 
            pendingWithdrawals: pendingWithdrawals || 0, 
            pendingDeposits: pendingDeposits || 0,
            totalTaskPaid: totalTaskPaid.toFixed(2),
            totalWithdrawnAmount: totalWithdrawnAmount.toFixed(2)
        });
    } catch (err) { 
        res.status(500).json({ error: "Failed to fetch stats" }); 
    }
});

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

app.post("/api/admin/reject-task", async (req, res) => {
    const { taskId } = req.body;
    try {
        await supabase.from('tasks').update({ status: 'rejected' }).eq('id', taskId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

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

app.post("/api/admin/action-withdraw", async (req, res) => {
    const { id, type, userId, amount } = req.body;
    try {
        if (type === 'approve') {
            await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
            
            const { data: profile } = await supabase.from('profiles').select('referrer_id').eq('id', userId).single();
            if (profile && profile.referrer_id) {
                const { count: prevApproved } = await supabase
                    .from('withdrawals')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('status', 'approved');
                
                if (prevApproved === 1) {
                    const { data: settings } = await supabase.from('settings').select('ref_bonus').eq('id', 1).single();
                    const refBonus = settings ? parseFloat(settings.ref_bonus) : 10;
                    
                    const { data: referrer } = await supabase.from('profiles').select('balance').eq('id', profile.referrer_id).single();
                    if (referrer) {
                        const newRefBalance = parseFloat(referrer.balance || 0) + refBonus;
                        await supabase.from('profiles').update({ balance: newRefBalance }).eq('id', profile.referrer_id);
                        
                        await supabase.from('tasks').insert({
                            user_id: profile.referrer_id,
                            task_name: `Referral Bonus (From Friend ${userId})`,
                            amount: refBonus,
                            category: 'referral',
                            proof_url: 'System Approved Referral',
                            status: 'approved'
                        });
                    }
                }
            }
        } else {
            const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            const newBalance = parseFloat(user.balance || 0) + parseFloat(amount);
            await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
            await supabase.from('withdrawals').update({ status: 'cancelled' }).eq('id', id);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/admin/add-task", async (req, res) => {
    const { title, reward, category, pass, link, rating, review_text } = req.body;
    try {
        const { error } = await supabase.from('admin_tasks').insert({
            title: title, 
            reward: parseFloat(reward), 
            category: category, 
            daily_password: pass || null,
            link: link || null,
            rating: rating || null,
            review_text: review_text || null
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

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

app.post("/api/admin/ban-user", async (req, res) => {
    const { userId, status } = req.body;
    try {
        await supabase.from('profiles').update({ is_banned: status }).eq('id', userId);
        res.json({ success: true, message: status ? "User Banned" : "User Unbanned" });
    } catch (err) { res.json({ success: false }); }
});

app.post("/api/admin/update-balance", async (req, res) => {
    const { userId, amount } = req.body;
    try {
        await supabase.from('profiles').update({ balance: parseFloat(amount) }).eq('id', userId);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

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

app.get("/api/admin/get-settings", async (req, res) => {
    try {
        const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
        res.json(data || {});
    } catch (err) { res.json({}); }
});

app.post("/api/admin/update-settings", async (req, res) => {
    const { min, ref, notice, daily_gift_code } = req.body;
    try {
        const updateData = { min_withdraw: min, ref_bonus: ref, app_notice: notice };
        if (daily_gift_code !== undefined) {
            updateData.daily_gift_code = daily_gift_code;
        }
        await supabase.from('settings').update(updateData).eq('id', 1);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// --- USER INCOME REPORT ---
app.get("/api/user-income/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('amount, created_at')
            .eq('user_id', userId)
            .eq('status', 'approved');
            
        if (error) throw error;
        
        let total = 0, today = 0, week = 0, month = 0, year = 0;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        if (data) {
            data.forEach(task => {
                const amt = parseFloat(task.amount || 0);
                const date = new Date(task.created_at);
                
                total += amt;
                if (date >= startOfToday) today += amt;
                if (date >= startOfWeek) week += amt;
                if (date >= startOfMonth) month += amt;
                if (date >= startOfYear) year += amt;
            });
        }
        
        res.json({
            total: total.toFixed(2),
            today: today.toFixed(2),
            week: week.toFixed(2),
            month: month.toFixed(2),
            year: year.toFixed(2)
        });
    } catch (err) {
        res.json({ total: "0.00", today: "0.00", week: "0.00", month: "0.00", year: "0.00" });
    }
});

// --- USER REFERRAL STATS ---
app.get("/api/referrals/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const { data: profiles, error: err } = await supabase
            .from('profiles')
            .select('id')
            .eq('referrer_id', userId);
        
        if (err) throw err;
        
        const totalRefs = profiles ? profiles.length : 0;
        let successRefs = 0;
        
        if (totalRefs > 0) {
            const referredIds = profiles.map(p => p.id);
            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('user_id')
                .in('user_id', referredIds)
                .eq('status', 'approved');
            
            if (withdrawals) {
                const uniqueSuccessIds = new Set(withdrawals.map(w => w.user_id));
                successRefs = uniqueSuccessIds.size;
            }
        }
        
        const { data: settings } = await supabase.from('settings').select('ref_bonus').eq('id', 1).single();
        const refBonus = settings ? parseFloat(settings.ref_bonus) : 20;
        const refIncome = successRefs * refBonus;
        
        res.json({
            total_refs: totalRefs,
            success_refs: successRefs,
            ref_income: refIncome.toFixed(2)
        });
    } catch (e) {
        res.json({ total_refs: 0, success_refs: 0, ref_income: "0.00" });
    }
});

app.get("/api/admin/user-referrals/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('referrer_id', req.params.id);
            
        if (error) throw error;
        
        const refsWithWithdraw = [];
        if (data) {
            for (let ref of data) {
                const { data: withdrawals } = await supabase
                    .from('withdrawals')
                    .select('amount')
                    .eq('user_id', ref.id)
                    .eq('status', 'approved');
                    
                const totalWithdrawn = withdrawals ? withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) : 0;
                refsWithWithdraw.push({
                    id: ref.id,
                    username: ref.username,
                    total_withdrawn: totalWithdrawn.toFixed(2)
                });
            }
        }
        res.json(refsWithWithdraw);
    } catch (err) {
        res.status(500).json([]);
    }
});

// --- BUY PREMIUM PLAN ---
app.post("/api/buy-premium", async (req, res) => {
    const { userId, plan, price } = req.body;
    try {
        const { data: user, error: err1 } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (err1 || !user) return res.status(404).json({ success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" });
        
        const balance = parseFloat(user.balance || 0);
        const planCost = parseFloat(price);
        
        if (balance < planCost) {
            return res.json({ success: false, message: "আপনার পর্যাপ্ত ব্যালেন্স নেই।" });
        }
        
        const newBalance = balance - planCost;
        
        const { error: err2 } = await supabase
            .from('profiles')
            .update({ balance: newBalance, tier: plan })
            .eq('id', userId);
            
        if (err2) throw err2;
        
        await supabase.from('tasks').insert({
            user_id: userId,
            task_name: `${plan} Plan Purchase`,
            amount: -planCost,
            category: 'premium',
            proof_url: 'System Approved',
            status: 'approved'
        });
        
        res.json({ success: true, message: `অভিনন্দন! আপনি সফলভাবে ${plan} মেম্বারশিপ কিনেছেন।` });
    } catch (err) {
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// --- UPDATED APIs ---
app.post("/api/withdraw", async (req, res) => {
    const { userId, method, accountNo, amount } = req.body;
    const withdrawGrossAmount = parseFloat(amount); 

    try {
        const { data: settings } = await supabase.from('settings').select('min_withdraw').eq('id', 1).single();
        const minAmount = settings ? parseFloat(settings.min_withdraw) : 100;

        if (withdrawGrossAmount < minAmount) {
            return res.json({ success: false, message: `ন্যূনতম ৳${minAmount} উত্তোলন করতে হবে।` });
        }

        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (!user || parseFloat(user.balance) < withdrawGrossAmount) {
            return res.json({ success: false, message: "আপনার পর্যাপ্ত ব্যালেন্স নেই।" });
        }

        const charge = withdrawGrossAmount * 0.02; 
        const netAmount = withdrawGrossAmount - charge; 

        const newBalance = parseFloat(user.balance) - withdrawGrossAmount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        
        await supabase.from('withdrawals').insert({ 
            user_id: userId, 
            amount: netAmount, 
            method, 
            account_no: accountNo, 
            status: 'pending' 
        });

        res.json({ 
            success: true, 
            message: `সফল! ৳${charge.toFixed(2)} চার্জ কেটে আপনার ৳${netAmount.toFixed(2)} পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে। বিঃদ্রঃ আমাদের পেমেন্ট সিস্টেম ১-২৪ ঘণ্টার ভিতরে পেমেন্ট করে থাকে।` 
        });

    } catch (err) { 
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" }); 
    }
});

app.get("/api/admin-tasks/:userId/:category", async (req, res) => {
    const { userId, category } = req.params;
    try {
        const { data: allTasks } = await supabase.from('admin_tasks').select('*').eq('category', category);
        const { data: userTasks } = await supabase.from('tasks').select('task_name').eq('user_id', userId);
        
        const submittedNames = userTasks ? userTasks.map(t => t.task_name) : [];
        const filteredTasks = allTasks.filter(task => !submittedNames.includes(task.title));
        
        res.json(filteredTasks || []);
    } catch (err) { res.json([]); }
});

app.get("/api/withdrawals/:userId", async (req, res) => {
    try {
        const { data } = await supabase.from('withdrawals').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false });
        res.json(data || []);
    } catch (err) { res.status(500).json([]); }
});

app.get("/api/tasks/history/:userId", async (req, res) => {
    try {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false });
        res.json(data || []);
    } catch (err) { res.status(500).json([]); }
});

app.get("/api/user-stats/:userId/:cat", async (req, res) => {
    try {
        const { data: approved } = await supabase.from('tasks').select('amount').eq('user_id', req.params.userId).eq('category', req.params.cat).eq('status', 'approved');
        const totalEarned = approved ? approved.reduce((sum, t) => sum + parseFloat(t.amount), 0) : 0;
        res.json({ totalSold: approved ? approved.length : 0, totalEarned: totalEarned.toFixed(2) });
    } catch (err) { res.json({ totalSold: 0, totalEarned: 0 }); }
});

// --- ADD MONEY (DEPOSIT) API ---
app.post("/api/add-money", async (req, res) => {
    const { userId, amount, transactionId, method } = req.body;
    try {
        const { error } = await supabase.from('deposits').insert({
            user_id: userId,
            amount: parseFloat(amount),
            transaction_id: transactionId,
            method: method,
            status: 'pending'
        });
        if (error) throw error;
        res.json({ success: true, message: "রিকোয়েস্ট জমা হয়েছে। এডমিন চেক করে ব্যালেন্স অ্যাড করে দিবে।" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- ADMIN: PENDING DEPOSITS ---
app.get("/api/admin/pending-deposits", async (req, res) => {
    try {
        const { data } = await supabase.from('deposits').select('*, profiles:user_id(username)').eq('status', 'pending');
        const mappedData = data ? data.map(d => ({
            ...d,
            trxid: d.transaction_id || d.trxid
        })) : [];
        res.json(mappedData);
    } catch (err) { res.status(500).json([]); }
});

app.post("/api/admin/deposit-status", async (req, res) => {
    const { id, status } = req.body;
    try {
        if (status === 'approve') {
            const { data: deposit, error: err1 } = await supabase.from('deposits').select('*').eq('id', id).single();
            if (err1 || !deposit) return res.status(404).json({ success: false });
            
            const { data: user, error: err2 } = await supabase.from('profiles').select('balance').eq('id', deposit.user_id).single();
            if (err2 || !user) return res.status(404).json({ success: false });
            
            const newBalance = parseFloat(user.balance || 0) + parseFloat(deposit.amount);
            await supabase.from('profiles').update({ balance: newBalance }).eq('id', deposit.user_id);
            await supabase.from('deposits').update({ status: 'approved' }).eq('id', id);
        } else {
            await supabase.from('deposits').update({ status: 'rejected' }).eq('id', id);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- PRODUCT SELLING (ACCOUNTS BUY) APIs ---
app.post("/api/admin/add-product", async (req, res) => {
    const { category, title, details, price } = req.body;
    try {
        const { error } = await supabase.from('products').insert({
            category: category.toLowerCase(),
            title: title,
            details: details,
            price: parseFloat(price),
            status: 'available'
        });
        if (error) throw error;
        res.json({ success: true, message: "পণ্য সফলভাবে যোগ করা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "পণ্য যোগ করতে ব্যর্থ হয়েছে।" });
    }
});

app.get("/api/products/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', req.params.category.toLowerCase())
            .eq('status', 'available');
            
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get("/api/orders/:userId", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', req.params.userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post("/api/buy-product", async (req, res) => {
    const { userId, productId, paymentMethod } = req.body;
    try {
        const { data: product, error: err1 } = await supabase.from('products').select('*').eq('id', productId).single();
        if (err1 || !product) return res.status(404).json({ success: false, message: "পণ্যটি খুঁজে পাওয়া যায়নি।" });
        if (product.status !== 'available') return res.json({ success: false, message: "পণ্যটি ইতিমধ্যে বিক্রি হয়ে গেছে।" });
        
        const price = parseFloat(product.price);
        let orderStatus = 'pending';
        let userBalance = 0;
        
        if (paymentMethod === 'balance') {
            const { data: user, error: err2 } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            if (err2 || !user) return res.status(404).json({ success: false, message: "ইউজার খুঁজে পাওয়া যায়নি।" });
            
            userBalance = parseFloat(user.balance || 0);
            if (userBalance < price) {
                return res.json({ success: false, message: "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।" });
            }
            
            const newBalance = userBalance - price;
            await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
            
            orderStatus = 'approved';
            await supabase.from('products').update({ status: 'sold' }).eq('id', productId);
        }
        
        const { error: err3 } = await supabase.from('orders').insert({
            user_id: userId,
            product_id: productId,
            title: product.title,
            price: price,
            payment_method: paymentMethod,
            status: orderStatus,
            details: orderStatus === 'approved' ? product.details : 'পেন্ডিং পেমেন্ট'
        });
        
        if (err3) throw err3;
        
        const responseMessage = paymentMethod === 'balance' 
            ? "ক্রয় সফল হয়েছে! ওয়ালেট ব্যালেন্স কাটা হয়েছে এবং বিবরণ 'ক্রয়কৃত একাওন্টস' ট্যাবে দেওয়া হয়েছে।" 
            : "ক্রয় অনুরোধ পেন্ডিং রয়েছে। অনুগ্রহ করে এডমিনের যাচাইকরণের জন্য অপেক্ষা করুন।";
            
        res.json({ success: true, message: responseMessage });
    } catch (err) {
        res.status(500).json({ success: false, message: "ক্রয় প্রক্রিয়া সম্পন্ন করতে সমস্যা হয়েছে।" });
    }
});

app.get("/api/admin/orders", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`*, profiles:user_id (username)`)
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post("/api/admin/action-order", async (req, res) => {
    const { id, status } = req.body;
    try {
        const { data: order, error: err1 } = await supabase.from('orders').select('*').eq('id', id).single();
        if (err1 || !order) return res.status(404).json({ success: false, message: "অর্ডার খুঁজে পাওয়া যায়নি।" });
        
        if (status === 'approve') {
            const { data: product } = await supabase.from('products').select('details').eq('id', order.product_id).single();
            const productDetails = product ? product.details : "অনুমোদিত হয়েছে";
            
            await supabase.from('orders').update({ status: 'approved', details: productDetails }).eq('id', id);
            await supabase.from('products').update({ status: 'sold' }).eq('id', order.product_id);
        } else {
            await supabase.from('orders').update({ status: 'rejected' }).eq('id', id);
            if (order.payment_method === 'balance') {
                const { data: user = {} } = await supabase.from('profiles').select('balance').eq('id', order.user_id).single();
                if (user) {
                    const newBalance = parseFloat(user.balance || 0) + parseFloat(order.price);
                    await supabase.from('profiles').update({ balance: newBalance }).eq('id', order.user_id);
                }
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/admin/all-products", async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

// --- PACKAGES ENDPOINTS ---
app.post("/api/admin/add-package", async (req, res) => {
    const { name, price, desc } = req.body;
    try {
        const { error } = await supabase.from('packages').insert({
            name: name,
            price: parseFloat(price),
            description: desc
        });
        if (error) throw error;
        res.json({ success: true, message: "প্যাকেজ সফলভাবে যোগ করা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/admin/packages", async (req, res) => {
    try {
        const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get("/api/packages", async (req, res) => {
    try {
        const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

// --- RECHARGE API ---
app.post("/api/recharge", async (req, res) => {
    const { userId, operator, number, amount } = req.body;
    try {
        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if(user.balance < amount) return res.json({success: false, message: "পর্যাপ্ত ব্যালেন্স নেই"});

        await supabase.from('profiles').update({ balance: user.balance - amount }).eq('id', userId);
        await supabase.from('withdrawals').insert({
            user_id: userId, amount, method: `Recharge (${operator})`, account_no: number, status: 'pending'
        });
        res.json({ success: true, message: "রিচার্জ রিকোয়েস্ট সফল!" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- BUY SOCIAL MEDIA SERVICE API ---
app.post("/api/buy-social-service", async (req, res) => {
    const { userId, serviceName, link, quantity, price } = req.body;
    try {
        const { data: user, error: err1 } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (err1 || !user) return res.status(404).json({ success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" });
        
        const balance = parseFloat(user.balance || 0);
        const totalCost = parseFloat(price);
        
        if (balance < totalCost) {
            return res.json({ success: false, message: "আপনার পর্যাপ্ত ব্যালেন্স নেই।" });
        }
        
        const newBalance = balance - totalCost;
        
        const { error: err2 } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);
            
        if (err2) throw err2;
        
        await supabase.from('tasks').insert({
            user_id: userId,
            task_name: `Social Service: ${serviceName} (${quantity} Qty)`,
            amount: -totalCost,
            category: 'social_service',
            proof_url: link,
            status: 'pending'
        });
        
        res.json({ success: true, message: `সফলভাবে অর্ডার করা হয়েছে! আপনার ব্যালেন্স থেকে ৳${totalCost.toFixed(2)} কেটে নেওয়া হয়েছে।` });
    } catch (err) {
        console.error("Social Order Purchase Error:", err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// --- ADMIN: DELETE PACKAGE ---
app.post("/api/admin/delete-package", async (req, res) => {
    const { id } = req.body;
    try {
        const { error } = await supabase.from('packages').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: "প্যাকেজ সফলভাবে মুছে ফেলা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "প্যাকেজ মুছতে ব্যর্থ হয়েছে।" });
    }
});

// --- ADMIN: SOCIAL MEDIA SERVICES CUSTOMIZATION ---
app.post("/api/admin/add-social-service", async (req, res) => {
    const { title, category, rate, minQty } = req.body;
    try {
        const { error } = await supabase.from('social_services').insert({
            title: title,
            category: category.toLowerCase(),
            rate: parseFloat(rate),
            min_qty: parseInt(minQty || 100)
        });
        if (error) throw error;
        res.json({ success: true, message: "সোশ্যাল মিডিয়া সার্ভিস সফলভাবে যুক্ত হয়েছে!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "সার্ভিস যোগ করতে ব্যর্থ হয়েছে।" });
    }
});

app.post("/api/admin/delete-social-service", async (req, res) => {
    const { id } = req.body;
    try {
        const { error } = await supabase.from('social_services').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: "সোশ্যাল মিডিয়া সার্ভিস সফলভাবে মুছে ফেলা হয়েছে!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "সার্ভিস মুছতে ব্যর্থ হয়েছে।" });
    }
});

// --- SOCIAL MEDIA SERVICES APIs (User Side) ---
app.get("/api/social-services/:category", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('social_services')
            .select('*')
            .eq('category', req.params.category.toLowerCase())
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get("/api/social-orders/:userId", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', req.params.userId)
            .eq('category', 'social_service')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

// --- WEEKLY SPIN API (প্রটেকশন সহ, ৳১০০ বা ৳২০০ দেওয়ার সুযোগ নেই) ---
app.post("/api/weekly-spin", async (req, res) => {
    const { userId } = req.body;
    try {
        const { data: lastSpins, error: spinErr } = await supabase
            .from('tasks')
            .select('created_at')
            .eq('user_id', userId)
            .eq('task_name', 'Weekly Spin')
            .order('created_at', { ascending: false })
            .limit(1);

        if (spinErr) throw spinErr;

        if (lastSpins && lastSpins.length > 0) {
            const lastSpinTime = new Date(lastSpins[0].created_at);
            const now = new Date();
            const diffDays = (now - lastSpinTime) / (1000 * 60 * 60 * 24);
            if (diffDays < 7) {
                const remainingDays = Math.ceil(7 - diffDays);
                return res.json({ success: false, message: `আপনি ইতিমধ্যে এই সপ্তাহে স্পিন করেছেন। আরও ${remainingDays} দিন পর আবার চেষ্টা করুন।` });
            }
        }

        // ১০০ এবং ২০০ টাকার ইডেক্স সম্পূর্ণ বাদ রেখে শুধু সাধারণ পুরস্কার ও খালি ঘর রেন্ডম সিলেক্ট করা হবে
        const allowedIndexes = [0, 1, 2, 3, 4, 5, 8];
        const prizeValues = [2, 2, 5, 10, 20, 50, 100, 200, 0];
        
        const randomIndex = allowedIndexes[Math.floor(Math.random() * allowedIndexes.length)];
        const winAmount = prizeValues[randomIndex];

        if (winAmount > 0) {
            const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            if (user) {
                const newBalance = parseFloat(user.balance || 0) + winAmount;
                await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
            }
        }

        await supabase.from('tasks').insert({
            user_id: userId,
            task_name: 'Weekly Spin',
            amount: winAmount,
            category: 'spin',
            proof_url: winAmount > 0 ? `Won ৳${winAmount}` : 'Better Luck Next Time',
            status: 'approved'
        });

        res.json({ success: true, winningIndex: randomIndex, winAmount: winAmount });
    } catch (err) {
        console.error("Spin error:", err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// --- DAILY GIFT CODE CLAIM API ---
app.post("/api/claim-gift-code", async (req, res) => {
    const { userId, code } = req.body;
    try {
        const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
        const officialCode = (settings && settings.daily_gift_code) ? settings.daily_gift_code : "GIFT5";

        if (!code || code.trim().toLowerCase() !== officialCode.trim().toLowerCase()) {
            return res.json({ success: false, message: "ভুল গিফট কোড! সঠিক কোডটি প্রদান করুন।" });
        }

        const { data: lastClaims } = await supabase
            .from('tasks')
            .select('created_at')
            .eq('user_id', userId)
            .eq('task_name', 'Daily Gift Box')
            .order('created_at', { ascending: false })
            .limit(1);

        if (lastClaims && lastClaims.length > 0) {
            const lastClaimTime = new Date(lastClaims[0].created_at);
            const now = new Date();
            const diffHours = (now - lastClaimTime) / (1000 * 60 * 60);
            if (diffHours < 24) {
                return res.json({ success: false, message: "আপনি ইতিমধ্যে আজকের গিফট বোনাসটি দাবি করেছেন!" });
            }
        }

        const { data: user } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (!user) {
            return res.status(404).json({ success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" });
        }

        const newBalance = parseFloat(user.balance || 0) + 5.00;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);

        await supabase.from('tasks').insert({
            user_id: userId,
            task_name: 'Daily Gift Box',
            amount: 5.00,
            category: 'gift',
            proof_url: `Code: ${code}`,
            status: 'approved'
        });

        res.json({ success: true, message: "অভিনন্দন! আপনি সফলভাবে ৳৫.০০ গিফট বোনাস পেয়েছেন।" });
    } catch (err) {
        console.error("Gift claim error:", err);
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
});

// Root & Health Check
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "webapp", "index.html")));
app.get("/health", (req, res) => res.json({ status: "online", app: "EarnBD-Pro" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});