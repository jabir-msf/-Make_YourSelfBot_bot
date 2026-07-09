const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let currentBalance = 0;
let miningRate = 0;

// অ্যাপ লোড হলে ডাটা আনা শুরু করবে
async function initDashboard() {
    if (!user) return;
    document.getElementById('userFirstName').innerText = user.first_name;

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data) {
            currentBalance = parseFloat(data.balance);
            miningRate = parseFloat(data.mining_rate || 0.0001);
            
            // ১. লাইভ ব্যালেন্স আপডেট শুরু
            setInterval(() => {
                currentBalance += (miningRate / 10);
                document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(4)}`;
                document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
            }, 100);

            // ২. বোনাস টাইমার সেটআপ
            setupBonusTimer(data.last_daily_bonus);
        }
    } catch (err) {
        console.error("Data load error:", err);
    }
}

// ডেইলি বোনাস কাউন্টডাউন লজিক
function setupBonusTimer(lastBonusDate) {
    const timerTxt = document.getElementById('bonusTimer');
    const bonusBtn = document.getElementById('dailyBonusBtn');

    setInterval(() => {
        const now = new Date();
        const lastBonus = lastBonusDate ? new Date(lastBonusDate) : new Date(0);
        const diff = now - lastBonus;
        const remain = (24 * 60 * 60 * 1000) - diff;

        if (remain <= 0) {
            timerTxt.innerText = "বোনাস নেওয়ার সময় হয়েছে!";
            bonusBtn.style.display = "block";
        } else {
            bonusBtn.style.display = "none";
            const h = Math.floor(remain / 3600000);
            const m = Math.floor((remain % 3600000) / 60000);
            const s = Math.floor((remain % 60000) / 1000);
            timerTxt.innerText = `পরবর্তী বোনাস: ${h}ঘ : ${m}মি : ${s}সে`;
        }
    }, 1000);
}

// মাইনিং ক্লেইম বাটন ফাংশন
document.getElementById('claimBtn').onclick = async () => {
    const btn = document.getElementById('claimBtn');
    btn.disabled = true;
    btn.innerText = "প্রসেসিং...";

    try {
        const res = await fetch('/api/claim-mining', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await res.json();
        if (result.success) {
            currentBalance = parseFloat(result.balance);
            tg.showAlert("✅ মাইনিং ব্যালেন্স সফলভাবে যোগ হয়েছে!");
        }
    } catch (e) {
        tg.showAlert("❌ সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
        btn.disabled = false;
        btn.innerText = "💰 মাইনিং ক্লেইম করুন";
    }
};

// ডেইলি বোনাস নিন বাটন ফাংশন
document.getElementById('dailyBonusBtn').onclick = async () => {
    try {
        const res = await fetch('/api/daily-bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await res.json();
        if (result.success) {
            tg.showAlert(`🎁 ${result.message}`);
            location.reload(); // রিলোড করে টাইমার রিসেট করা
        } else {
            tg.showAlert(result.message);
        }
    } catch (e) {
        tg.showAlert("সার্ভার ত্রুটি!");
    }
};

// পেজ ইনিশিয়ালাইজ করুন
initDashboard();

// টেলিগ্রামের ক্লোজ কনফার্মেশন অন রাখা
tg.enableClosingConfirmation();
