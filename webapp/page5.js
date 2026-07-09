document.addEventListener('DOMContentLoaded', () => {
    const withdrawBtn = document.getElementById('withdrawBtn');
    const amountInput = document.getElementById('amount');
    const accountInput = document.getElementById('accountNo');

    withdrawBtn.addEventListener('click', () => {
        const amount = amountInput.value;
        const account = accountInput.value;

        if (!account) {
            alert('অনুগ্রহ করে একাউন্ট নম্বর দিন');
            return;
        }

        if (amount < 100) {
            alert('ন্যূনতম উত্তোলনের পরিমাণ ১০০ টাকা');
            return;
        }

        // Logic for withdrawal
        alert('আপনার উত্তোলনের অনুরোধটি গ্রহণ করা হয়েছে। ১-২৪ ঘণ্টার মধ্যে পেমেন্ট পেয়ে যাবেন।');
        
        // Reset fields
        amountInput.value = '';
        accountInput.value = '';
    });

    // Simple interaction for input background change on focus
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.background = '#e8eeff';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.background = '#f1f4ff';
        });
    });
});
