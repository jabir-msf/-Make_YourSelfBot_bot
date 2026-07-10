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
            const sideName = document.getElementById('sideName');
            const sideInitial = document.getElementById('sideInitial');
            const sideBalance = document.getElementById('sideBalanceDisplay');

            if(sideName) sideName.innerText = user.first_name || "ইউজার";
            if(sideInitial) sideInitial.innerText = (user.first_name || "U").charAt(0);
            if(sideBalance) sideBalance.innerText = `৳${currentBalance.toFixed(2)}`;
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
        // UI-তে ডিফল্ট ভ্যালু বসানো (NaN রোধ করতে)
        updateBalanceUI();
        return;
    }
    
    // ড্যাশবোর্ডে ইউজারের নাম সেট করা
    const userNameElement = document.getElementById('userFirstName');
    if(userNameElement) userNameElement.innerText = user.first_name;

    try {
        // API থেকে ইউজারের ডাটা আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data && !data.error) {
            // ডাটাবেসে যে ব্যালেন্স আছে শুধু সেটুকুই দেখাবে (parseFloat logic fixed)
            currentBalance = parseFloat(data.balance) || 0;
        } else {
            currentBalance = 0.00;
        }

        updateBalanceUI();

    } catch (err) {
        console.error("Dashboard Data load error:", err);
        currentBalance = 0.00;
        updateBalanceUI();
    }
}

// ব্যালেন্স UI আপডেট করার ফাংশন (সব জায়গায় আপডেট হবে)
function updateBalanceUI() {
    // ড্যাশবোর্ডের মেইন ব্যালেন্স
    const mainBal = document.getElementById('mainBalance');
    if(mainBal) mainBal.innerText = `৳${currentBalance.toFixed(2)}`;

    // টপ বারের ছোট ব্যালেন্স
    const topBal = document.getElementById('topBalance');
    if(topBal) topBal.innerText = `৳${currentBalance.toFixed(2)}`;
    
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
