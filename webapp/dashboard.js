const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let currentBalance = 0;
let miningRate = 0;

// অ্যাপ লোড হলে ডাটাবেস থেকে তথ্য আনবে
async function initDashboard() {
    if (!user) return;
    
    // ইউজারের নাম সেট করা
    document.getElementById('userFirstName').innerText = user.first_name;

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data) {
            currentBalance = parseFloat(data.balance);
            // ডাটাবেসে mining_rate না থাকলেও ০.০০০১ ডিফল্ট হিসেবে থাকবে
            miningRate = parseFloat(data.mining_rate || 0.0001);
            
            // লাইভ ব্যালেন্স কাউন্টার শুরু (Visual Effect)
            setInterval(() => {
                currentBalance += (miningRate / 10);
                document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(4)}`;
                document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
            }, 100);
        }
    } catch (err) {
        console.error("Dashboard Data load error:", err);
    }
}

// পেজ ইনিশিয়ালাইজ করুন
initDashboard();

// টেলিগ্রামের অ্যাপ বড় করে দেখানো
tg.expand();
tg.enableClosingConfirmation();
