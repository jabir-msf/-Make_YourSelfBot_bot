const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
let currentBalance = 0;

// Sidebar Logic
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        if(user) {
            document.getElementById('sideName').innerText = user.first_name || "ইউজার";
            document.getElementById('sideInitial').innerText = (user.first_name || "U").charAt(0);
            document.getElementById('sideBalanceDisplay').innerText = `৳${currentBalance.toFixed(2)}`;
        }
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

// Data Load
async function initDashboard() {
    if (!user) return;
    if(document.getElementById('userFirstName')) document.getElementById('userFirstName').innerText = user.first_name;
    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        currentBalance = parseFloat(data.balance) || 0;
        updateBalanceUI();
    } catch (err) { updateBalanceUI(); }
}

function updateBalanceUI() {
    const balText = `৳${currentBalance.toFixed(2)}`;
    if(document.getElementById('mainBalance')) document.getElementById('mainBalance').innerText = balText;
    if(document.getElementById('topBalance')) document.getElementById('topBalance').innerText = balText;
    if(document.getElementById('sideBalanceDisplay')) document.getElementById('sideBalanceDisplay').innerText = balText;
}

// Modal System
function closeModal() { document.getElementById('actionModal').style.display = 'none'; }

function openAddMoney() {
    const modal = document.getElementById('actionModal');
    document.getElementById('modalTitle').innerText = "অ্যাড মানি";
    document.getElementById('modalBody').innerHTML = `
        <div class="info-box">
            বিকাশ/নগদ/রকেট (Personal): <br><b>01855707214</b> <br>
            প্রথমে সেন্ড মানি করুন, তারপর নিচের তথ্য দিয়ে রিকোয়েস্ট দিন।
        </div>
        <label>পেমেন্ট মেথড</label>
        <select id="depMethod" class="modal-input">
            <option value="Bkash">Bkash</option>
            <option value="Nagad">Nagad</option>
            <option value="Rocket">Rocket</option>
        </select>
        <label>টাকার পরিমাণ</label>
        <input type="number" id="depAmount" class="modal-input" placeholder="৳ কত টাকা পাঠিয়েছেন?">
        <label>ট্রানজেকশন আইডি (TrxID)</label>
        <input type="text" id="depTrx" class="modal-input" placeholder="আপনার ট্রানজেকশন আইডি দিন">
        <button class="modal-btn" onclick="submitDeposit()">কনফার্ম করুন</button>
    `;
    modal.style.display = 'flex';
}

async function submitDeposit() {
    const method = document.getElementById('depMethod').value;
    const amount = document.getElementById('depAmount').value;
    const trxId = document.getElementById('depTrx').value;
    if(!amount || !trxId) return alert("সবগুলো তথ্য সঠিকভাবে দিন!");
    
    try {
        const res = await fetch('/api/add-money', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, amount, transactionId: trxId, method })
        });
        const data = await res.json();
        tg.showAlert(data.message);
        closeModal();
    } catch (e) { tg.showAlert("সার্ভারে সমস্যা হয়েছে।"); }
}

function openRecharge() {
    const modal = document.getElementById('actionModal');
    document.getElementById('modalTitle').innerText = "মোবাইল রিচার্জ";
    document.getElementById('modalBody').innerHTML = `
        <label>অপারেটর</label>
        <select id="recOp" class="modal-input">
            <option value="GP">Grameenphone</option>
            <option value="Robi">Robi</option>
            <option value="BL">Banglalink</option>
            <option value="Airtel">Airtel</option>
            <option value="Teletalk">Teletalk</option>
        </select>
        <label>মোবাইল নাম্বার</label>
        <input type="number" id="recNum" class="modal-input" placeholder="01XXXXXXXXX">
        <label>টাকার পরিমাণ (নিন্মতম ২০৳)</label>
        <input type="number" id="recAmt" class="modal-input" placeholder="৳">
        <button class="modal-btn" style="background:#27ae60" onclick="submitRec()">রিচার্জ রিকোয়েস্ট পাঠান</button>
    `;
    modal.style.display = 'flex';
}

async function submitRec() {
    const operator = document.getElementById('recOp').value;
    const number = document.getElementById('recNum').value;
    const amount = document.getElementById('recAmt').value;
    if(!number || amount < 20) return alert("সঠিক নাম্বার এবং পরিমাণ দিন।");

    try {
        const res = await fetch('/api/recharge', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, operator, number, amount })
        });
        const data = await res.json();
        tg.showAlert(data.message);
        if(data.success) { closeModal(); initDashboard(); }
    } catch (e) { tg.showAlert("সার্ভারে সমস্যা হয়েছে।"); }
}

function showAdmins() {
    tg.showPopup({
        title: 'এডমিন সাপোর্ট',
        message: 'যেকোনো সমস্যার জন্য এডমিনকে মেসেজ দিন।',
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

function comingSoon() {
    tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে!");
}

initDashboard();
tg.expand();
