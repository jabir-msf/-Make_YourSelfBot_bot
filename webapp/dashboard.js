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

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

// ডাটাবেস থেকে ব্যালেন্স লোড
async function initDashboard() {
    if (!user) {
        updateBalanceUI();
        return;
    }
    
    const userNameElement = document.getElementById('userFirstName');
    if(userNameElement) userNameElement.innerText = user.first_name;

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data && !data.error) {
            currentBalance = parseFloat(data.balance) || 0;
        } else {
            currentBalance = 0.00;
        }

        updateBalanceUI();

    } catch (err) {
        currentBalance = 0.00;
        updateBalanceUI();
    }
}

function updateBalanceUI() {
    const mainBal = document.getElementById('mainBalance');
    if(mainBal) mainBal.innerText = `৳${currentBalance.toFixed(2)}`;

    const topBal = document.getElementById('topBalance');
    if(topBal) topBal.innerText = `৳${currentBalance.toFixed(2)}`;
    
    const sideDisplay = document.getElementById('sideBalanceDisplay');
    if(sideDisplay) sideDisplay.innerText = `৳${currentBalance.toFixed(2)}`;
}

// অ্যাড মানি (ট্রানজেকশন আইডি ইন্টারফেস)
async function openAddMoney() {
    const amount = prompt("কত টাকা পাঠিয়েছেন?");
    if (!amount) return;
    const method = prompt("পেমেন্ট মেথড (Bkash/Nagad):");
    if (!method) return;
    const trxId = prompt("আপনার ট্রানজেকশন আইডি (Transaction ID) দিন:");
    if (!trxId) return;

    try {
        const response = await fetch('/api/add-money', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, amount, transactionId: trxId, method })
        });
        const res = await response.json();
        tg.showAlert(res.message);
    } catch (e) {
        tg.showAlert("সার্ভারে সমস্যা হয়েছে।");
    }
}

// রিচার্জ ইন্টারফেস
async function openRecharge() {
    const operator = prompt("অপারেটর সিলেক্ট করুন (GP/Robi/BL/Airtel/Teletalk):");
    if (!operator) return;
    const number = prompt("মোবাইল নাম্বার দিন:");
    if (!number) return;
    const amount = prompt("টাকার পরিমাণ দিন:");
    if (!amount) return;

    const confirmMsg = `অপারেটর: ${operator}\nনাম্বার: ${number}\nটাকা: ৳${amount}\n\nরিচার্জ রিকোয়েস্ট দেওয়ার ১ ঘণ্টার ভিতরে টাকা পাবেন। আপনি কি নিশ্চিত?`;
    
    if (confirm(confirmMsg)) {
        try {
            const response = await fetch('/api/recharge', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userId: user.id, operator, number, amount })
            });
            const res = await response.json();
            tg.showAlert(res.message);
            if(res.success) initDashboard(); // ব্যালেন্স রিফ্রেশ
        } catch (e) {
            tg.showAlert("সার্ভারে সমস্যা হয়েছে।");
        }
    }
}

// এডমিন কন্টাক্ট লজিক
function showAdmins() {
    // এখানে আপনার এডমিনদের ইউজারনেম দিন
    const admin1 = "AdminUsername1"; 
    const admin2 = "AdminUsername2";
    
    tg.showPopup({
        title: 'এডমিন সাপোর্ট',
        message: 'যেকোনো সমস্যার জন্য এডমিনকে মেসেজ দিন।',
        buttons: [
            {id: 'a1', type: 'default', text: 'এডমিন ১ (Telegram)'},
            {id: 'a2', type: 'default', text: 'এডমিন ২ (Telegram)'},
            {type: 'cancel', text: 'বন্ধ করুন'}
        ]
    }, (id) => {
        if(id === 'a1') tg.openTelegramLink(`https://t.me/${admin1}`);
        if(id === 'a2') tg.openTelegramLink(`https://t.me/${admin2}`);
    });
}

function comingSoon() {
    tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে!");
}

initDashboard();
tg.expand();
tg.enableClosingConfirmation();
