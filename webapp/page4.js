const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// আপনার দেওয়া বট ইউজারনেম
const botUsername = "makeyourself12_bot"; 

async function loadReferralData() {
    if (!user) return;

    // ১. রেফারেল কোড ও লিঙ্ক সেটআপ (ইউজার আইডি অনুযায়ী)
    const refCode = user.id; // যেমন: 282147...
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;

    document.getElementById('refCodeDisplay').innerText = refCode;
    document.getElementById('refLinkDisplay').innerText = refLink;

    try {
        // ২. ব্যালেন্স লোড করা (NaN প্রোটেকশনসহ)
        const responseUser = await fetch(`/api/user/${user.id}`);
        const userData = await responseUser.json();

        if (userData && !userData.error) {
            const balance = parseFloat(userData.balance || 0);
            document.getElementById('refPageBalance').innerText = `৳${balance.toFixed(0)}`;
        } else {
            document.getElementById('refPageBalance').innerText = `৳০`;
        }

        // ৩. সার্ভার থেকে আসল রেফারেল সংখ্যা আনা
        const responseRefs = await fetch(`/api/referrals/${user.id}`);
        const refData = await responseRefs.json();
        
        document.getElementById('totalRefs').innerText = refData.total_refs || 0;
        // সফল রেফার ও ইনকাম আপাতত ০ (ডাটাবেসে ডাটা থাকলে পরে আপডেট হবে)
        document.getElementById('successRefs').innerText = "0";
        document.getElementById('refIncome').innerText = `৳০`;

    } catch (err) {
        console.error("Referral Load Error:", err);
        document.getElementById('refPageBalance').innerText = `৳০`;
    }
}

// কপি বাটন লজিক
document.getElementById('copyCodeBtn').addEventListener('click', () => {
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;
    navigator.clipboard.writeText(refLink);
    tg.showAlert("আপনার রেফারেল লিঙ্ক কপি হয়েছে!");
});

// হোয়াটসঅ্যাপ শেয়ার
document.getElementById('shareWA').addEventListener('click', () => {
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;
    const text = `Make Your Self অ্যাপে জয়েন করুন এবং আয় করুন: ${refLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
});

// টেলিগ্রাম শেয়ার
document.getElementById('shareTG').addEventListener('click', () => {
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;
    const text = `Make Your Self অ্যাপে জয়েন করে প্রতিদিন ঘরে বসে আয় করুন! আমার রেফারেল লিঙ্ক:`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`);
});

// টেলিগ্রাম ব্যাক বাটন
tg.BackButton.show();
tg.BackButton.onClick(() => {
    history.back();
});

loadReferralData();
tg.expand();
