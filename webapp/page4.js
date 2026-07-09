const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// আপনার বটের ইউজারনেম (বিনা @ এ)
const botUsername = "Make_Your_SelfBot"; 

async function loadReferralData() {
    if (!user) return;

    // ১. রেফারেল কোড ও লিঙ্ক জেনারেট
    const refCode = `MYS-${user.id}`;
    const refLink = `https://t.me/${botUsername}?start=${user.id}`;

    document.getElementById('refCodeDisplay').innerText = refCode;
    document.getElementById('refLinkDisplay').innerText = refLink;

    try {
        // ২. ডাটাবেস থেকে ব্যালেন্স ও রেফারেল পরিসংখ্যান আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();

        if (data) {
            document.getElementById('refPageBalance').innerText = `৳${parseFloat(data.balance).toFixed(0)}`;
            // এখানে আপনি ডাটাবেস থেকে রেফার সংখ্যা আনবেন, আপাতত ০ দেখাচ্ছি
            // ডাটাবেসে রেফার ট্র্যাকিং যোগ করলে এগুলো আপডেট হবে
        }
    } catch (err) {
        console.error("Referral data load error:", err);
    }

    // ৩. কপি বাটন লজিক
    document.getElementById('copyCodeBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(refLink); // সাধারণত লিঙ্ক কপি করা বেশি কার্যকর
        tg.showScanQrPopup({ text: "লিঙ্ক কপি হয়েছে!" }); // ছোট পপআপ
        setTimeout(() => tg.closeScanQrPopup(), 1000);
    });

    // ৪. টেলিগ্রাম শেয়ার বাটন
    document.getElementById('shareTG').addEventListener('click', () => {
        const text = `Make Your Self অ্যাপে জয়েন করে প্রতিদিন ঘরে বসে আয় করুন! আমার রেফারেল লিঙ্ক:`;
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`);
    });

    // ৫. হোয়াটসঅ্যাপ শেয়ার বাটন
    document.getElementById('shareWA').addEventListener('click', () => {
        const text = `Make Your Self অ্যাপে জয়েন করুন: ${refLink}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    });
}

// টেলিগ্রামের ব্যাক বাটন সচল করা
tg.BackButton.show();
tg.BackButton.onClick(() => {
    history.back();
});

loadReferralData();
