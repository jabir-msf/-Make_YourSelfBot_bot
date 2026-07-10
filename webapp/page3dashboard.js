const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// ব্যালেন্স লোড করা
async function loadServicePageData() {
    if (!user) return;
    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        const balance = parseFloat(data.balance || 0);
        document.getElementById('servicePageBalance').innerText = `৳${balance.toFixed(2)}`;
    } catch (err) {
        document.getElementById('servicePageBalance').innerText = `৳0.00`;
    }
}

// সাধারণ টাস্ক (যেমন কুইজ) শুরু করা
function startTask(name, amount) {
    window.location.href = `task_work.html?name=${encodeURIComponent(name)}&amount=${amount}`;
}

// লিমিটেড টাস্ক (অ্যাড এবং ভিডিও) শুরু করা
async function startLimitedTask(type) {
    if (!user) return;

    try {
        // সার্ভার থেকে লিমিট চেক করা
        const res = await fetch('/api/earn/limit-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: type })
        });
        const result = await res.json();

        if (result.success) {
            // লিমিট ওকে থাকলে কাজের পেজে নিয়ে যাবে
            const taskName = type === 'ad' ? 'অ্যাড আর্নিং' : 'ভিডিও ইনকাম';
            const amount = type === 'ad' ? '1.50' : '5.00';
            window.location.href = `task_work.html?name=${encodeURIComponent(taskName)}&amount=${amount}&type=${type}`;
        } else {
            // লিমিট শেষ হলে মেসেজ দিবে
            tg.showAlert(result.message);
        }
    } catch (err) {
        tg.showAlert("দুঃখিত, প্রযুক্তিগত সমস্যা হচ্ছে।");
    }
}

function comingSoon() {
    tg.showAlert("এই সার্ভিসটি খুব শীঘ্রই চালু করা হবে। আমাদের সাথেই থাকুন!");
}

loadServicePageData();
tg.expand();

// গ্লোবাল এক্সেস
window.startTask = startTask;
window.startLimitedTask = startLimitedTask;
window.comingSoon = comingSoon;
