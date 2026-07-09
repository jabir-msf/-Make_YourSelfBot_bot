
document.addEventListener('DOMContentLoaded', () => {
    
    // Copy Referral Code
    const copyBtn = document.getElementById('copyCode');
    const refCode = document.getElementById('refCode').innerText;

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(refCode).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> কপিড';
            copyBtn.style.background = '#2ecc71';
            
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-paste"></i> কপি';
                copyBtn.style.background = '#0d3b94';
            }, 2000);
        });
    });

    // Navigation Active Switch
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active-nav'));
            this.classList.add('active-nav');
        });
    });

    // Social Share Mockup
    const shareBtns = document.querySelectorAll('.btn-share');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.innerText;
            alert(platform + ' শেয়ার অপশন ওপেন হচ্ছে...');
        });
    });
});
