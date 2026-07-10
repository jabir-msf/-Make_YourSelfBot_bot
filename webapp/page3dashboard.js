const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// সার্ভিস পেজের ব্যালেন্স ডাটা লোড করা
async function loadServicePageData() {
    // টেলিগ্রাম ইউজার না থাকলে থামিয়ে দিবে
    if (!user) {
        console.error("Telegram user not found!");
        return;
    }

    try {
        // API থেকে ইউজারের ডাটা ফেচ করা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        let currentBalance = 0;

        // যদি ডাটাবেসে ইউজার থাকে, তবে তার আসল ব্যালেন্স নেওয়া
        if (data && !data.error) {
            currentBalance = parseFloat(data.balance || 0);
        } else {
            // ইউজার না পাওয়া গেলে বা ব্যালেন্স ফাকা থাকলে ০ সেট করা (NaN প্রোটেকশন)
            currentBalance = 0.00;
        }

        // HTML-এর id="servicePageBalance" অংশে ব্যালেন্স দেখানো
        const balanceDisplay = document.getElementById('servicePageBalance');
        if (balanceDisplay) {
            balanceDisplay.innerText = `৳${currentBalance.toFixed(2)}`;
        }

    } catch (err) {
        console.error("Balance loading error:", err);
        // এরর হলেও যেন NaN না দেখায়, ০ দেখায়
        const balanceDisplay = document.getElementById('servicePageBalance');
        if (balanceDisplay) {
            balanceDisplay.innerText = `৳0.00`;
        }
    }
}

// সার্ভিস বাটনগুলোতে ক্লিক করলে এই মেসেজটি দেখাবে
function comingSoon() {
    tg.showAlert("এই সার্ভিসটি খুব শীঘ্রই চালু করা হবে। আমাদের সাথেই থাকুন!");
}

// পেজ চালু হওয়ার সাথে সাথে ব্যালেন্স লোড করা
loadServicePageData();

// টেলিগ্রাম অ্যাপ সেটিংস
tg.expand(); // অ্যাপটি বড় করে ওপেন করা
tg.enableClosingConfirmation(); // অ্যাপ বন্ধের সময় কনফার্মেশন চাওয়া

// HTML থেকে সরাসরি ফাংশন কল করার জন্য গ্লোবাল উইন্ডোতে রাখা হলো
window.comingSoon = comingSoon;
