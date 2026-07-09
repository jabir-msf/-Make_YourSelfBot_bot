document.addEventListener('DOMContentLoaded', () => {
    const telegramBtn = document.getElementById('btnTelegram');
    const verifyBtn = document.getElementById('btnVerify');
    const refreshIcon = document.querySelector('.refresh-icon');

    // Telegram Button Click
    telegramBtn.addEventListener('click', () => {
        alert('টেলিগ্রাম চ্যানেলে নিয়ে যাওয়া হচ্ছে...');
        // window.location.href = 'YOUR_TELEGRAM_LINK';
    });

    // Verify Button Click
    verifyBtn.addEventListener('click', () => {
        alert('ভেরিফিকেশন শুরু হচ্ছে...');
    });

    // Refresh Action
    refreshIcon.addEventListener('click', () => {
        location.reload();
    });
});
