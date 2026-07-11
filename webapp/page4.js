const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
const botUsername = "makeyourself12_bot"; 

async function loadReferralData() {
    if (!user) return;

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

        // রেফারেল সংখ্যা ও রিয়েলটাইম ইনকাম আপডেট
        const resRefs = await fetch(`/api/referrals/${user.id}`);
        const refStats = await resRefs.json();
        
        document.getElementById('totalRefs').innerText = refStats.total_refs || 0;
        document.getElementById('successRefs').innerText = refStats.success_refs || 0;
        document.getElementById('refIncome').innerText = `৳${parseFloat(refStats.ref_income || 0).toFixed(0)}`;

    } catch (err) {
        document.getElementById('refPageBalance').innerText = `৳০`;
        document.getElementById('totalRefs').innerText = "0";
        document.getElementById('successRefs').innerText = "0";
        document.getElementById('refIncome').innerText = "৳০";
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
