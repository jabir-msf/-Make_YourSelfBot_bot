
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// Sidebar Elements
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');

// মেনু খোলা
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

// মেনু বন্ধ করা
overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

async function initDashboard() {
    if (!user) return;
    
    // ইউজার ডাটা সেট করা
    document.getElementById('userFirstName').innerText = user.first_name;
    document.getElementById('sidebarName').innerText = user.first_name + " " + (user.last_name || "");
    document.getElementById('initials').innerText = user.first_name.charAt(0);

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data) {
            let currentBalance = parseFloat(data.balance);
            let miningRate = parseFloat(data.mining_rate || 0.0001);
            
            setInterval(() => {
                currentBalance += (miningRate / 10);
                document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(4)}`;
                document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
                document.getElementById('sidebarBalance').innerText = `৳${currentBalance.toFixed(2)}`;
            }, 100);
        }
    } catch (err) { console.error(err); }
}

function comingSoon() {
    tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে!");
}

initDashboard();
tg.expand();
