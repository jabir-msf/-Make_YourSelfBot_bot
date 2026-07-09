const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let currentBalance = 0;
let miningRate = 0;

// Sidebar Elements
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// মেনু ওপেন করা
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    
    // সাইডবারে ইউজার ডাটা সিঙ্ক করা
    if(user) {
        document.getElementById('sideName').innerText = user.first_name;
        document.getElementById('sideInitial').innerText = user.first_name.charAt(0);
        document.getElementById('sideBalanceDisplay').innerText = `৳${currentBalance.toFixed(2)}`;
    }
});

// মেনু বন্ধ করা
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

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
            miningRate = parseFloat(data.mining_rate || 0.0001);
            
            // লাইভ ব্যালেন্স কাউন্টার শুরু
            setInterval(() => {
                currentBalance += (miningRate / 10);
                document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(4)}`;
                document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
                // সাইডবার ওপেন থাকলে সেখানেও আপডেট হবে
                if(sidebar.classList.contains('active')){
                    document.getElementById('sideBalanceDisplay').innerText = `৳${currentBalance.toFixed(2)}`;
                }
            }, 100);
        }
    } catch (err) {
        console.error("Dashboard Data load error:", err);
    }
}

function comingSoon() {
    tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে!");
}

// পেজ ইনিশিয়ালাইজ করুন
initDashboard();

// টেলিগ্রামের অ্যাপ বড় করে দেখানো
tg.expand();
tg.enableClosingConfirmation();
