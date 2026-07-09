const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;

// ইউজারের নাম সেট করা
if (user) {
    document.getElementById('userName').innerText = user.first_name || "ইউজার";
}

// Facebook Page Button লজিক
document.getElementById('btnFacebook').addEventListener('click', () => {
    // এখানে আপনার ফেসবুক পেজের আসল লিঙ্কটি দিন
    const facebookUrl = "https://www.facebook.com/YourPageID"; 
    tg.openLink(facebookUrl); 
});

// Verify Button লজিক
document.getElementById('btnVerify').addEventListener('click', () => {
    const btn = document.getElementById('btnVerify');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> প্রসেসিং...';
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
});

tg.enableClosingConfirmation();
