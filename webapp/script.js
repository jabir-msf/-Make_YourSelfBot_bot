// ১. টেলিগ্রাম ওয়েব অ্যাপ অবজেক্ট ইনিশিয়ালাইজ করা
const tg = window.Telegram.WebApp;

// অ্যাপটি স্ক্রিনে বড় করে দেখানোর জন্য
tg.expand();

// ২. টেলিগ্রাম থেকে ইউজারের ডাটা সংগ্রহ করা
const user = tg.initDataUnsafe.user;

// ৩. ইউজারের নাম পেজে প্রদর্শন করা
if (user) {
    const nameSpan = document.getElementById('userName');
    if (nameSpan) {
        // যদি ফার্স্ট নেম না থাকে তবে ইউজারনেম দেখাবে
        nameSpan.innerText = user.first_name || user.username || "ইউজার";
    }
}

// ৪. "Join Telegram Channel" বাটনের কাজ
document.getElementById('btnTelegram').addEventListener('click', () => {
    // এখানে আপনার চ্যানেলের সঠিক ইউজারনেম দিন (বিনা @ এ)
    const channelLink = "https://t.me/EarnBD_Pro"; 
    tg.openTelegramLink(channelLink);
});

// ৫. "ভেরিফাই করুন ও শুরু করুন" বাটনের কাজ
document.getElementById('btnVerify').addEventListener('click', () => {
    // এখানে চাইলে আপনি বাটন ক্লিক করার পর একটি ছোট লোডিং ইফেক্ট দিতে পারেন
    const btn = document.getElementById('btnVerify');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ভেরিফাই হচ্ছে...';
    
    // ২ সেকেন্ড পর ড্যাশবোর্ডে নিয়ে যাবে
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
});

// ব্যাক বাটন বা ক্লোজ কনফার্মেশন (ঐচ্ছিক)
tg.enableClosingConfirmation();
