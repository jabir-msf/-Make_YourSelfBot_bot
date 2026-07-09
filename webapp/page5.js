const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

async function loadWithdrawPage() {
    if (!user) return;

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        if (data) {
            document.getElementById('withdrawBalanceDisplay').innerText = `৳${parseFloat(data.balance).toFixed(2)}`;
        }
    } catch (err) { console.error(err); }
}

document.getElementById('withdrawBtn').addEventListener('click', async () => {
    const method = document.getElementById('paymentMethod').value;
    const account = document.getElementById('accountNo').value;
    const amount = document.getElementById('amount').value;

    if (!account || amount < 100) {
        return tg.showAlert("সঠিক নম্বর এবং ন্যূনতম ১০০ টাকা দিন।");
    }

    // কনফার্মেশন চাওয়া
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
                    window.location.href = 'page6.html'; // হিস্ট্রিতে নিয়ে যাবে
                } else {
                    tg.showAlert(result.message);
                    btn.disabled = false;
                    btn.innerText = "✅ উত্তোলন করুন";
                }
            } catch (err) {
                tg.showAlert("একটি ত্রুটি হয়েছে!");
                btn.disabled = false;
            }
        }
    });
});

loadWithdrawPage();

// ব্যাক বাটন সচল করা
tg.BackButton.show();
tg.BackButton.onClick(() => history.back());
