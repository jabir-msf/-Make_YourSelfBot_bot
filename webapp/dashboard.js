const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
let currentBalance = 0;

// Sidebar & Overlay
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
    sidebarOverlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}

// Dashboard Initializer
async function initDashboard() {
    if (!user) return updateBalanceUI();
    const userNameElement = document.getElementById('userFirstName');
    if(userNameElement) userNameElement.innerText = user.first_name;

    try {
        const response = await fetch(`/api/user/${user.id}`);
        const data = await response.json();
        currentBalance = (data && !data.error) ? parseFloat(data.balance) : 0;
        updateBalanceUI();
    } catch (err) { updateBalanceUI(); }
}

function updateBalanceUI() {
    const mainBal = document.getElementById('mainBalance');
    const topBal = document.getElementById('topBalance');
    const sideBal = document.getElementById('sideBalanceDisplay');
    if(mainBal) mainBal.innerText = `৳${currentBalance.toFixed(2)}`;
    if(topBal) topBal.innerText = `৳${currentBalance.toFixed(2)}`;
    if(sideBal) sideBal.innerText = `৳${currentBalance.toFixed(2)}`;
}

// Modal Logic
function closeActionModal() {
    document.getElementById('actionModal').style.display = 'none';
}

function openAddMoney() {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    title.innerText = "অ্যাড মানি (Add Money)";
    modal.style.display = 'flex';
    content.innerHTML = `
        <div class="modal-info-box">
            👉 বিকাশ/নগদ/রকেট (পার্সোনাল): <b>01855707214</b><br>
            প্রথমে উপরে দেওয়া নম্বরে <b>Send Money</b> করুন। এরপর নিচের ফর্মটি পূরণ করুন।
        </div>
        <label>পেমেন্ট মেথড</label>
        <select id="payMethod" class="modal-input">
            <option value="Bkash">Bkash</option>
            <option value="Nagad">Nagad</option>
            <option value="Rocket">Rocket</option>
        </select>
        <label>কত টাকা পাঠিয়েছেন?</label>
        <input type="number" id="payAmount" class="modal-input" placeholder="পরিমাণ দিন">
        <label>ট্রানজেকশন আইডি (TrxID)</label>
        <input type="text" id="payTrx" class="modal-input" placeholder="আপনার TrxID দিন">
        <button class="modal-btn" onclick="submitDeposit()">সাবমিট করুন</button>
    `;
}

async function submitDeposit() {
    const method = document.getElementById('payMethod').value;
    const amount = document.getElementById('payAmount').value;
    const trxId = document.getElementById('payTrx').value;

    if(!amount || !trxId) return tg.showAlert("সবগুলো ঘর পূরণ করুন!");

    try {
        const res = await fetch('/api/add-money', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, amount, transactionId: trxId, method })
        });
        const data = await res.json();
        tg.showAlert(data.message);
        closeActionModal();
    } catch (e) { tg.showAlert("সার্ভারে সমস্যা হয়েছে।"); }
}

function openRecharge() {
    const modal = document.getElementById('actionModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    title.innerText = "মোবাইল রিচার্জ";
    modal.style.display = 'flex';
    content.innerHTML = `
        <label>অপারেটর সিলেক্ট করুন</label>
        <select id="recOp" class="modal-input">
            <option value="GP">Grameenphone</option>
            <option value="Robi">Robi</option>
            <option value="Banglalink">Banglalink</option>
            <option value="Airtel">Airtel</option>
            <option value="Teletalk">Teletalk</option>
        </select>
        <label>মোবাইল নাম্বার</label>
        <input type="number" id="recNum" class="modal-input" placeholder="01XXXXXXXXX">
        <label>টাকার পরিমাণ</label>
        <input type="number" id="recAmt" class="modal-input" placeholder="৳২০ - ৳১০০০">
        <button class="modal-btn" style="background:#27ae60;" onclick="submitRecharge()">রিচার্জ রিকোয়েস্ট দিন</button>
    `;
}

async function submitRecharge() {
    const operator = document.getElementById('recOp').value;
    const number = document.getElementById('recNum').value;
    const amount = document.getElementById('recAmt').value;

    if(!number || !amount) return tg.showAlert("সব তথ্য দিন!");
    if(amount < 20) return tg.showAlert("সর্বনিম্ন ২০ টাকা রিচার্জ রিকোয়েস্ট দিতে পারবেন।");

    try {
        const response = await fetch('/api/recharge', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, operator, number, amount })
        });
        const res = await response.json();
        tg.showAlert(res.message);
        if(res.success) { closeActionModal(); initDashboard(); }
    } catch (e) { tg.showAlert("সার্ভারে সমস্যা হয়েছে।"); }
}

function showAdmins() {
    tg.showPopup({
        title: 'এডমিন সাপোর্ট',
        message: 'যেকোনো সমস্যার জন্য সরাসরি এডমিনকে মেসেজ দিন।',
        buttons: [
            {id: 'a1', type: 'default', text: 'এডমিন ১ (@lucky_mahi_26)'},
            {id: 'a2', type: 'default', text: 'এডমিন ২ (ID: 8144639897)'},
            {type: 'cancel', text: 'বন্ধ করুন'}
        ]
    }, (id) => {
        if(id === 'a1') tg.openTelegramLink(`https://t.me/lucky_mahi_26`);
        if(id === 'a2') tg.openTelegramLink(`https://t.me/userinfobot?start=8144639897`);
    });
}

function comingSoon() { tg.showAlert("এই ফিচারটি খুব শীঘ্রই আসছে!"); }

initDashboard();
tg.expand();
tg.enableClosingConfirmation();
