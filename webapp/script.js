const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;

// ইউজারের নাম সেট করা
if (user) {
    document.getElementById('userName').innerText = user.first_name || "ইউজার";
}

// Facebook Page Button লজিক
document.getElementById('btnFacebook').addEventListener('click', () => {
    const facebookUrl = "https://facebook.com/allaquariumyt"; 
    tg.openLink(facebookUrl); 
});

// Verify Button লজিক
document.getElementById('btnVerify').addEventListener('click', () => {
    const btn = document.getElementById('btnVerify');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> প্রসেসিং...';
    
    // লগইন স্টেট সংরক্ষণ
    localStorage.setItem('mys_logged_in', 'true');
    
    setTimeout(() => {
        window.location.replace('dashboard.html');
    }, 1500);
});

tg.enableClosingConfirmation();
