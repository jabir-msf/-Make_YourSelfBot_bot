const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// সার্ভিস পেজের ব্যালেন্স ডাটা লোড করা
async function loadServicePageData() {
    if (!user) return;

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        let currentBalance = 0;
        if (data && !data.error) {
            currentBalance = parseFloat(data.balance || 0);
        }

        const balanceDisplay = document.getElementById('servicePageBalance');
        if (balanceDisplay) {
            balanceDisplay.innerText = `৳${currentBalance.toFixed(2)}`;
        }

    } catch (err) {
        const balanceDisplay = document.getElementById('servicePageBalance');
        if (balanceDisplay) balanceDisplay.innerText = `৳0.00`;
    }
}

// টাস্ক শুরু করার ফাংশন
function startTask(name, amount) {
    // ইউজারকে টাস্ক ওয়ার্ক পেজে পাঠাবে
    window.location.href = `task_work.html?name=${encodeURIComponent(name)}&amount=${amount}`;
}

function comingSoon() {
    tg.showAlert("এই সার্ভিসটি খুব শীঘ্রই চালু করা হবে। আমাদের সাথেই থাকুন!");
}

loadServicePageData();

tg.expand();
tg.enableClosingConfirmation();

// গ্লোবাল উইন্ডোতে ফাংশনগুলো রাখা হলো
window.comingSoon = comingSoon;
window.startTask = startTask;
