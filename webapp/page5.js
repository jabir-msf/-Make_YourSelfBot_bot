const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// গ্লোবাল ভেরিয়েবল (ডিফল্ট ১০০)
let minWithdrawAmount = 100;

// পেজ লোড হলে ব্যালেন্স এবং এডমিন সেটিংস ডাটা আনা
async function loadWithdrawPage() {
    if (!user) {
        console.log("No User Found");
        return;
    }

    try {
        // ১. ইউজারের ব্যালেন্স ডাটা আনা
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        
        let currentBalance = 0;
        if (data && !data.error) {
            currentBalance = parseFloat(data.balance || 0);
        } else {
            currentBalance = 0.00;
        }

        // ব্যালেন্স প্রদর্শন
        const display = document.getElementById('withdrawBalanceDisplay');
        if (display) {
            display.innerText = `৳${currentBalance.toFixed(2)}`;
        }

        // ২. এডমিন প্যানেলের সেটিংস থেকে মিনিমাম উইথড্র লিমিট আনা
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        
        if (settingsData && settingsData.min_withdraw) {
            minWithdrawAmount = parseFloat(settingsData.min_withdraw);
        }

        // ৩. UI আপডেট করা (সেটিংস অনুযায়ী)
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.placeholder = `ন্যূনতম ৳${minWithdrawAmount}`;
        }

        // ইনফো টেবিলের "ন্যূনতম" রো আপডেট করা
        const infoValues = document.querySelectorAll('.info-row .val');
        if (infoValues.length > 1) {
            infoValues[1].innerText = `৳${minWithdrawAmount}`;
        }

    } catch (err) { 
        console.error("Data fetch error:", err);
        const display = document.getElementById('withdrawBalanceDisplay');
        if (display) display.innerText = `৳0.00`;
    }
}

// উত্তোলন বাটন লজিক
document.getElementById('withdrawBtn').addEventListener('click', async () => {
    const method = document.getElementById('paymentMethod').value;
    const account = document.getElementById('accountNo').value;
    const amountStr = document.getElementById('amount').value;
    const amount = parseFloat(amountStr);

    // ভ্যালিডেশন
    if (!account || isNaN(amount) || amount < minWithdrawAmount) {
        return tg.showAlert(`সঠিক নম্বর দিন এবং ন্যূনতম ৳${minWithdrawAmount} উত্তোলন করুন।`);
    }

    // ২% সার্ভিস চার্জ হিসাব
    const charge = amount * 0.02; // ২% চার্জ
    const finalAmount = amount - charge; // ইউজার যা পাবে

    // কনফার্মেশন চাওয়া (চার্জের হিসাবসহ)
    tg.showConfirm(`৳${amount} উত্তোলনে ২% (৳${charge.toFixed(2)}) সার্ভিস চার্জ কাটা হবে। আপনি পাবেন ৳${finalAmount.toFixed(2)}। আপনি কি নিশ্চিত?`, async (confirmed) => {
        if (confirmed) {
            const btn = document.getElementById('withdrawBtn');
            btn.disabled = true;
            btn.innerText = "প্রসেসিং...";

            try {
                const res = await fetch('/api/withdraw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, method, accountNo: account, amount: amount })
                });
                const result = await res.json();

                if (result.success) {
                    tg.showAlert(result.message);
                    window.location.href = 'page6.html'; // হিস্ট্রি পেজে নিয়ে যাবে
                } else {
                    tg.showAlert(result.message);
                    btn.disabled = false;
                    btn.innerText = "✅ উত্তোলন করুন";
                }
            } catch (err) {
                tg.showAlert("সার্ভারে সমস্যা হয়েছে! আবার চেষ্টা করুন।");
                btn.disabled = false;
                btn.innerText = "✅ উত্তোলন করুন";
            }
        }
    });
});

// পেজ ইনিশিয়ালাইজ করা
loadWithdrawPage();

// টেলিগ্রাম ব্যাক বাটন সচল করা
tg.BackButton.show();
tg.BackButton.onClick(() => {
    history.back();
});

// টেলিগ্রাম অ্যাপ সেটিংস
tg.expand();
tg.enableClosingConfirmation();
