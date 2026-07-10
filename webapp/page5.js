const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// পেজ লোড হলে ব্যালেন্স ডাটা আনা
async function loadWithdrawPage() {
    if (!user) {
        console.log("No User Found");
        return;
    }

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        
        let currentBalance = 0;

        // ব্যালেন্স চেক এবং NaN প্রোটেকশন (|| 0 ব্যবহারের মাধ্যমে)
        if (data && !data.error) {
            currentBalance = parseFloat(data.balance || 0);
        } else {
            currentBalance = 0.00;
        }

        // HTML-এর id="withdrawBalanceDisplay" অংশে ব্যালেন্স দেখানো
        const display = document.getElementById('withdrawBalanceDisplay');
        if (display) {
            display.innerText = `৳${currentBalance.toFixed(2)}`;
        }

    } catch (err) { 
        console.error("Balance fetch error:", err);
        const display = document.getElementById('withdrawBalanceDisplay');
        if (display) display.innerText = `৳0.00`;
    }
}

// উত্তোলন বাটন লজিক
document.getElementById('withdrawBtn').addEventListener('click', async () => {
    const method = document.getElementById('paymentMethod').value;
    const account = document.getElementById('accountNo').value;
    const amount = document.getElementById('amount').value;

    // ভ্যালিডেশন
    if (!account || amount < 100) {
        return tg.showAlert("সঠিক নম্বর এবং ন্যূনতম ১০০ টাকা দিন।");
    }

    // কনফার্মেশন চাওয়া (আপনার অরিজিনাল লজিক)
    tg.showConfirm(`আপনি কি নিশ্চিত যে ৳${amount} (${method}) উত্তোলন করতে চান?`, async (confirmed) => {
        if (confirmed) {
            const btn = document.getElementById('withdrawBtn');
            btn.disabled = true;
            btn.innerText = "প্রসেসিং...";

            try {
                const res = await fetch('/api/withdraw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, method, accountNo: account, amount })
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
                tg.showAlert("একটি ত্রুটি হয়েছে!");
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
