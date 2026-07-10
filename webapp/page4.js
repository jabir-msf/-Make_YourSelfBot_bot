const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
const botUsername = "makeyourself12_bot"; 

async function loadReferralData() {
    if (!user) return;

    // আপনার ইউজার আইডিই হবে রেফারেল কোড
    const refCode = user.id; 
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;

    document.getElementById('refCodeDisplay').innerText = refCode;
    document.getElementById('refLinkDisplay').innerText = refLink;

    try {
        // ব্যালেন্স আপডেট
        const resUser = await fetch(`/api/user/${user.id}`);
        const userData = await resUser.json();
        const balance = parseFloat(userData.balance || 0);
        document.getElementById('refPageBalance').innerText = `৳${balance.toFixed(0)}`;

        // রেফারেল সংখ্যা আপডেট
        const resRefs = await fetch(`/api/referrals/${user.id}`);
        const refStats = await resRefs.json();
        document.getElementById('totalRefs').innerText = refStats.total_refs || 0;
        
        // ইনকাম হিসাব (প্রতি সফল রেফারে ২০ টাকা হিসেবে ধরলে)
        // document.getElementById('refIncome').innerText = `৳${refStats.total_refs * 20}`;

    } catch (err) {
        document.getElementById('refPageBalance').innerText = `৳০`;
    }
}

document.getElementById('copyCodeBtn').addEventListener('click', () => {
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;
    navigator.clipboard.writeText(refLink);
    tg.showAlert("লিঙ্ক কপি হয়েছে!");
});

document.getElementById('shareTG').addEventListener('click', () => {
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Make Your Self-এ জয়েন করে আয় করুন!`);
});

document.getElementById('shareWA').addEventListener('click', () => {
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(refLink)}`, '_blank');
});

tg.BackButton.show();
tg.BackButton.onClick(() => history.back());
loadReferralData();
