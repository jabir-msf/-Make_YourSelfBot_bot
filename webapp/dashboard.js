const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
let currentBalance = 0, miningRate = 0;

async function init() {
    if (!user) return;
    document.getElementById('userFirstName').innerText = user.first_name;
    const res = await fetch(`/api/user/${user.id}`);
    const data = await res.json();
    
    currentBalance = parseFloat(data.balance);
    miningRate = parseFloat(data.mining_rate);

    // লাইভ কাউন্টার
    setInterval(() => {
        currentBalance += (miningRate / 10);
        document.getElementById('mainBalance').innerText = `৳${currentBalance.toFixed(4)}`;
        document.getElementById('topBalance').innerText = `৳${currentBalance.toFixed(2)}`;
    }, 100);

    // বোনাস টাইমার
    setupTimer(data.last_daily_bonus);
}

function setupTimer(lastDate) {
    const timerTxt = document.getElementById('bonusTimer');
    const btn = document.getElementById('dailyBonusBtn');
    
    setInterval(() => {
        const diff = new Date() - new Date(lastDate || 0);
        const remain = (24 * 60 * 60 * 1000) - diff;
        if (remain <= 0) {
            timerTxt.innerText = "বোনাস রেডি!";
            btn.style.display = "block";
        } else {
            const h = Math.floor(remain / 3600000);
            const m = Math.floor((remain % 3600000) / 60000);
            const s = Math.floor((remain % 60000) / 1000);
            timerTxt.innerText = `পরবর্তী বোনাস: ${h}ঘ : ${m}মি : ${s}সে`;
            btn.style.display = "none";
        }
    }, 1000);
}

document.getElementById('claimBtn').onclick = async () => {
    const res = await fetch('/api/claim-mining', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id })
    });
    const result = await res.json();
    if(result.success) { currentBalance = result.balance; tg.showAlert("ক্লেইম সফল!"); }
};

document.getElementById('dailyBonusBtn').onclick = async () => {
    const res = await fetch('/api/daily-bonus', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id })
    });
    const result = await res.json();
    tg.showAlert(result.message);
    if(result.success) location.reload();
};

init();
