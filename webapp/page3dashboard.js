const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

async function loadServicePage() {
    if (!user) return;

    try {
        // ডাটাবেস থেকে ইউজারের তথ্য আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data) {
            // ব্যালেন্স ফরম্যাট করে দেখানো (৳৮৬৪ এর মতো)
            const balance = parseFloat(data.balance).toFixed(0);
            document.getElementById('servicePageBalance').innerText = `৳${balance}`;
        }
    } catch (err) {
        console.error("Balance Load Error:", err);
    }
}

// যে কাজগুলো এখনো তৈরি হয়নি তার জন্য একটি এলার্ট
function comingSoon() {
    tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে! অনুগ্রহ করে অপেক্ষা করুন।");
}

// পেজ লোড হলে ফাংশনটি রান করবে
loadServicePage();

// টেলিগ্রামের ব্যাক বাটন সচল করা
tg.BackButton.show();
tg.BackButton.onClick(() => {
    history.back();
});
