const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let currentBalance = 0;
let miningRate = 0.001; // প্রতি সেকেন্ডে

async function initDashboard() {
    if (!user) return;

    // ইউজারের নাম সেট করা
    document.getElementById('userFirstName').innerText = user.first_name;

    try {
        // ১. সার্ভার থেকে ইউজারের ডাটা আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data) {
            currentBalance = parseFloat(data.balance);
            miningRate = parseFloat(data.mining_rate || 0.0001);

            // ২. লাইভ ব্যালেন্স কাউন্টার শুরু করা
            startLiveBalance();
        }
    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

function startLiveBalance() {
    setInterval(() => {
        // প্রতি ১০০ মিলিসেকেন্ডে ব্যালেন্স একটু করে বাড়ানো (Visual)
        currentBalance += (miningRate / 10);
        
        // ড্যাশবোর্ডে আপডেট করা
        document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(4)}`;
        document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
    }, 100);
}

// ৩. ক্লেইম বাটন ফাংশন
document.getElementById('claimBtn').addEventListener('click', async () => {
    const btn = document.getElementById('claimBtn');
    btn.disabled = true;
    btn.innerText = "প্রসেসিং হচ্ছে...";

    try {
        const res = await fetch('/api/claim-mining', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await res.json();

        if (result.success) {
            currentBalance = parseFloat(result.balance);
            tg.showAlert("অভিনন্দন! আপনার মাইনিং ব্যালেন্স মূল ব্যালেন্সে যোগ হয়েছে।");
        }
    } catch (err) {
        tg.showAlert("দুঃখিত! ক্লেইম করতে সমস্যা হয়েছে।");
    } finally {
        btn.disabled = false;
        btn.innerText = "💰 মাইনিং ক্লেইম করুন";
    }
});

// ড্যাশবোর্ড ইনিশিয়ালাইজ করুন
initDashboard();
