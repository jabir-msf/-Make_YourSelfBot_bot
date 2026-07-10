const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let minWithdrawAmount = 100;

async function loadWithdrawPage() {
    if (!user) return;
    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        let currentBalance = 0;
        if (data && !data.error) {
            currentBalance = parseFloat(data.balance || 0);
        }
        const display = document.getElementById('withdrawBalanceDisplay');
        if (display) display.innerText = `৳${currentBalance.toFixed(2)}`;

        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData && settingsData.min_withdraw) {
            minWithdrawAmount = parseFloat(settingsData.min_withdraw);
        }

        const amountInput = document.getElementById('amount');
        if (amountInput) amountInput.placeholder = `ন্যূনতম ৳${minWithdrawAmount}`;

        const infoValues = document.querySelectorAll('.info-row .val');
        if (infoValues.length > 1) infoValues[1].innerText = `৳${minWithdrawAmount}`;
    } catch (err) { console.error(err); }
}

document.getElementById('withdrawBtn').addEventListener('click', async () => {
    const method = document.getElementById('paymentMethod').value;
    const account = document.getElementById('accountNo').value;
    const amountStr = document.getElementById('amount').value;
    const amount = parseFloat(amountStr);

    if (!account || isNaN(amount) || amount < minWithdrawAmount) {
        return tg.showAlert(`সঠিক নম্বর দিন এবং ন্যূনতম ৳${minWithdrawAmount} উত্তোলন করুন।`);
    }

    // লজিক পরিবর্তন: ফিক্সড ২ টাকা চার্জ
    const charge = 2; 
    const finalAmount = amount - charge;

    tg.showConfirm(`৳${amount} উত্তোলনে ৳${charge} সার্ভিস চার্জ কাটা হবে। আপনি পাবেন ৳${finalAmount.toFixed(2)}। আপনি কি নিশ্চিত?`, async (confirmed) => {
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
                    window.location.href = 'page6.html';
                } else {
                    tg.showAlert(result.message);
                    btn.disabled = false;
                    btn.innerText = "✅ উত্তোলন করুন";
                }
            } catch (err) {
                tg.showAlert("সার্ভারে সমস্যা হয়েছে।");
                btn.disabled = false;
                btn.innerText = "✅ উত্তোলন করুন";
            }
        }
    });
});

loadWithdrawPage();
tg.BackButton.show();
tg.BackButton.onClick(() => history.back());
tg.expand();
