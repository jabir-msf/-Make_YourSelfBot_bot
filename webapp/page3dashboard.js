const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let currentBalance = 0;

// পেজ লোড হলে ব্যালেন্স আপডেট করা
async function initServicePage() {
    if (!user) {
        console.error("Telegram user not found!");
        return;
    }

    try {
        // সার্ভার থেকে ইউজার ডাটা আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data && !data.error) {
            // ডাটা থাকলে সেটি সেট করা
            currentBalance = parseFloat(data.balance || 0);
        } else {
            // ডাটা না থাকলে ০ সেট করা (NaN প্রোটেকশন)
            currentBalance = 0.00;
        }

        // ব্যালেন্স UI আপডেট করা
        updateUI();

    } catch (err) {
        console.error("Error loading balance:", err);
        currentBalance = 0.00;
        updateUI();
    }
}

// ব্যালেন্স দেখানোর ফাংশন
function updateUI() {
    // আপনার HTML-এ ব্যালেন্স দেখানোর জন্য যে এলিমেন্টগুলো আছে
    const balanceDisplay = document.getElementById('page3Balance') || document.querySelector('.balance-pill span');
    
    if (balanceDisplay) {
        balanceDisplay.innerText = `৳${currentBalance.toFixed(2)}`;
    }
}

// প্রতিটি সার্ভিস বাটনের জন্য ফাংশন
function openTask(taskName) {
    // আপনি চাইলে এখানে টাস্ক অনুযায়ী আলাদা পেজে পাঠাতে পারেন
    // আপাতত "শীঘ্রই আসছে" মেসেজ দেখাবে
    tg.showAlert(`${taskName} সার্ভিসটি খুব শীঘ্রই চালু করা হবে।`);
}

// ব্যানার বা বিশেষ বাটন ক্লিক লজিক (উত্তোলন ইতিহাস, কাজের বিবরণ ইত্যাদি)
function navigateTo(url) {
    window.location.href = url;
}

// পেজ ইনিশিয়ালাইজ করা
initServicePage();

// টেলিগ্রাম সেটিংস
tg.expand(); // অ্যাপটি ফুল স্ক্রিন করা
tg.BackButton.show(); // ব্যাক বাটন দেখানো
tg.BackButton.onClick(() => {
    window.location.href = 'dashboard.html'; // ড্যাশবোর্ডে ফিরে যাওয়া
});

// আপনার HTML এর বাটনগুলোতে যদি সরাসরি ফাংশন কল করতে চান, তবে এগুলো গ্লোবাল করে দেওয়া হলো
window.openTask = openTask;
window.navigateTo = navigateTo;
