const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
const botUsername = "Make_Your_SelfBot"; // আপনার বটের নাম @ ছাড়া

async function loadReferralData() {
    if (!user) return;

    const refCode = `MYS-${user.id}`;
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;

    document.getElementById('refCodeDisplay').innerText = refCode;
    document.getElementById('refLinkDisplay').innerText = refLink;

    try {
        // ১. ব্যালেন্স আপডেট করা
        const responseUser = await fetch(`/api/user/${user.id}`);
        const dataUser = await responseUser.json();
        if (dataUser) {
            document.getElementById('refPageBalance').innerText = `৳${parseFloat(dataUser.balance).toFixed(0)}`;
        }

        // ২. মোট রেফারেল সংখ্যা আনা (নতুন API থেকে)
        const responseRefs = await fetch(`/api/referrals/${user.id}`);
        const dataRefs = await responseRefs.json();
        document.getElementById('totalRefs').innerText = dataRefs.total_refs || 0;
        
        // সফল রেফারের ইনকাম হিসাব (যদি প্রতি রেফারে ২০ টাকা হয়)
        // নোট: এটি লজিক অনুযায়ী ডাটাবেস থেকেও আনা যেতে পারে
        // document.getElementById('refIncome').innerText = `৳${dataRefs.total_refs * 20}`;

    } catch (err) {
        console.error("Referral Data Error:", err);
    }

    // কপি বাটন
    document.getElementById('copyCodeBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(refLink);
        tg.showAlert("লিঙ্ক কপি করা হয়েছে!");
    });

    // শেয়ার বাটন
    document.getElementById('shareTG').addEventListener('click', () => {
        const text = `Make Your Self অ্যাপে জয়েন করুন এবং আয় করুন!`;
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`);
    });
}

tg.BackButton.show();
tg.BackButton.onClick(() => history.back());
loadReferralData();
