const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let currentBalance = 0;

// Sidebar Elements
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// মেনু ওপেন করার লজিক
if (menuBtn) {
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
}

// মেনু বন্ধ করার লজিক
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

// অ্যাপ লোড হলে ডাটাবেস থেকে শুধু বর্তমান ব্যালেন্স দেখাবে
async function initDashboard() {
    if (!user) {
        console.error("Telegram user not found!");
        return;
    }
    
    // ড্যাশবোর্ডে ইউজারের নাম সেট করা
    document.getElementById('userFirstName').innerText = user.first_name;

    try {
        // API থেকে ইউজারের ডাটা আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data && !data.error) {
            // ডাটাবেসে যে ব্যালেন্স আছে শুধু সেটুকুই দেখাবে
            currentBalance = parseFloat(data.balance || 0);
        } else {
            // ডাটা না থাকলে ০ দেখাবে
            currentBalance = 0.00;
        }

        // স্ক্রিনে ব্যালেন্স আপডেট করা (এটি আর অটো বাড়বে না)
        updateBalanceUI();

    } catch (err) {
        console.error("Dashboard Data load error:", err);
        currentBalance = 0.00;
        updateBalanceUI();
    }
}

// ব্যালেন্স UI আপডেট করার ফাংশন
function updateBalanceUI() {
    // ড্যাশবোর্ডের মেইন ব্যালেন্স (৳০.০০ স্টাইলে)
    document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(2)}`;
    // টপ বারের ছোট ব্যালেন্স
    document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
    
    // সাইডবার ওপেন থাকলে সেখানেও আপডেট হবে
    const sideDisplay = document.getElementById('sideBalanceDisplay');
    if(sideDisplay) {
        sideDisplay.innerText = `৳${currentBalance.toFixed(2)}`;
    }
}

// "শীঘ্রই আসছে" মেসেজ
function comingSoon() {
    tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে!");
}

// পেজ ইনিশিয়ালাইজ করা
initDashboard();

// টেলিগ্রামের অ্যাপ সেটিংস
tg.expand();
tg.enableClosingConfirmation();
