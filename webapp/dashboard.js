const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
let currentBalance = 0;

// Sidebar & Init
async function initDashboard() {
    if (!user) return;
    document.getElementById('userFirstName').innerText = user.first_name;
    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        currentBalance = parseFloat(data.balance) || 0;
        updateBalanceUI();
    } catch (err) { updateBalanceUI(); }
}

function updateBalanceUI() {
    const balText = `৳${currentBalance.toFixed(2)}`;
    ['mainBalance', 'topBalance', 'sideBalanceDisplay'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).innerText = balText;
    });
}

function closeModal() { document.getElementById('actionModal').style.display = 'none'; }

function openAddMoney() {
    const modal = document.getElementById('actionModal');
    document.getElementById('modalTitle').innerText = "অ্যাড মানি";
    document.getElementById('modalBody').innerHTML = `
        <div class="info-box">বিকাশ/নগদ/রকেট: <br><b>01855707214</b></div>
        <select id="depMethod" class="modal-input"><option>Bkash</option><option>Nagad</option><option>Rocket</option></select>
        <input type="number" id="depAmount" class="modal-input" placeholder="৳">
        <input type="text" id="depTrx" class="modal-input" placeholder="TrxID">
        <button class="modal-btn" onclick="submitDeposit()">সাবমিট</button>`;
    modal.style.display = 'flex';
}

async function submitDeposit() {
    const res = await fetch('/api/add-money', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId: user.id, amount: document.getElementById('depAmount').value, transactionId: document.getElementById('depTrx').value, method: document.getElementById('depMethod').value }) });
    const data = await res.json();
    tg.showAlert(data.message); closeModal();
}

function openRecharge() {
    const modal = document.getElementById('actionModal');
    document.getElementById('modalTitle').innerText = "মোবাইল রিচার্জ";
    document.getElementById('modalBody').innerHTML = `
        <select id="recOp" class="modal-input"><option>GP</option><option>Robi</option><option>BL</option></select>
        <input type="number" id="recNum" class="modal-input" placeholder="নাম্বার">
        <input type="number" id="recAmt" class="modal-input" placeholder="৳">
        <button class="modal-btn" style="background:#27ae60" onclick="submitRec()">রিচার্জ রিকোয়েস্ট</button>`;
    modal.style.display = 'flex';
}

async function submitRec() {
    const res = await fetch('/api/recharge', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId: user.id, operator: document.getElementById('recOp').value, number: document.getElementById('recNum').value, amount: document.getElementById('recAmt').value }) });
    const data = await res.json(); tg.showAlert(data.message); if(data.success) { closeModal(); initDashboard(); }
}

function showAdmins() {
    tg.showPopup({ 
        title: 'সাপোর্ট', 
        message: 'এডমিনকে মেসেজ দিন।', 
        buttons: [
            {id: 'a1', type: 'default', text: 'এডমিন ১ (@lucky_mahi_26)'}, 
            {id: 'a2', type: 'default', text: 'এডমিন ২ (@jabiralsoaib)'}, 
            {type: 'cancel', text: 'বন্ধ করুন'}
        ] 
    }, (id) => { 
        if(id === 'a1') tg.openTelegramLink('https://t.me/lucky_mahi_26'); 
        if(id === 'a2') tg.openTelegramLink('https://t.me/jabiralsoaib'); 
    });
}

function comingSoon() { tg.showAlert("খুব শীঘ্রই আসছে!"); }
initDashboard();
