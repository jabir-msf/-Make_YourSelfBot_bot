const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// সার্ভিস পেজের ব্যালেন্স ডাটা লোড করা
async function loadServicePageData() {
    if (!user) {
        console.error("Telegram user not found!");
        return;
    }

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        let currentBalance = 0;
        if (data && !data.error) {
            currentBalance = parseFloat(data.balance || 0);
        } else {
            currentBalance = 0.00;
        }

        const balanceDisplay = document.getElementById('servicePageBalance');
        if (balanceDisplay) {
            balanceDisplay.innerText = `৳${currentBalance.toFixed(2)}`;
        }

    } catch (err) {
        console.error("Balance loading error:", err);
        const balanceDisplay = document.getElementById('servicePageBalance');
        if (balanceDisplay) {
            balanceDisplay.innerText = `৳0.00`;
        }
    }
}

// সাধারণ টাস্ক শুরু করা (যেমন কুইজ)
function startTask(name, amount) {
    window.location.href = `task_work.html?name=${encodeURIComponent(name)}&amount=${amount}`;
}

// লিমিটেড টাস্ক (অ্যাড এবং ভিডিও) শুরু করা - লিমিট চেক সহ
async function startLimitedTask(type) {
    if (!user) {
        tg.showAlert("ইউজার ডাটা পাওয়া যায়নি!");
        return;
    }

    const taskName = type === 'ad' ? 'অ্যাড আর্নিং' : 'ভিডিও ইনকাম';
    const reward = type === 'ad' ? '1.50' : '5.00';

    try {
        // সার্ভার থেকে লিমিট চেক করা
        const res = await fetch('/api/earn/limit-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: type })
        });
        
        const result = await res.json();

        if (result.success) {
            // লিমিট ওকে থাকলে টাস্ক সাবমিট পেজে নিয়ে যাবে
            // নোট: এখানে cat=${type} যোগ করা হয়েছে যাতে task_submit পেজ বুঝতে পারে এটা ad নাকি video
            window.location.href = `task_submit.html?name=${encodeURIComponent(taskName)}&amount=${reward}&cat=${type}`;
        } else {
            // লিমিট শেষ হলে সার্ভার থেকে আসা মেসেজ দেখাবে
            tg.showAlert(result.message);
        }
    } catch (err) {
        console.error(err);
        tg.showAlert("সার্ভারে সমস্যা হচ্ছে, কিছুক্ষণ পর চেষ্টা করুন।");
    }
}

function comingSoon() {
    tg.showAlert("এই সার্ভিসটি খুব শীঘ্রই চালু করা হবে। আমাদের সাথেই থাকুন!");
}

// পেজ চালু হওয়ার সাথে সাথে ব্যালেন্স লোড করা
loadServicePageData();

// টেলিগ্রাম অ্যাপ সেটিংস
tg.expand();
tg.enableClosingConfirmation();

// HTML থেকে সরাসরি কল করার জন্য গ্লোবাল উইন্ডোতে রাখা হলো
window.comingSoon = comingSoon;
window.startTask = startTask;
window.startLimitedTask = startLimitedTask;
