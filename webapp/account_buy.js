// ES5 সমর্থিত ভেরিয়েবল ও অবজেক্ট ডিফাইন
var categoryNames = {
    gmail: "Gmail",
    tiktok: "Tiktok",
    fb: "Facebook",
    insta: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp"
};

var selectedAccount = null;

// একাওন্ট তালিকা প্রদর্শন
function showAccounts(category, event) {
    if (event) {
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }
    }

    var listContainer = document.getElementById('accountListContainer');
    var titleElement = document.getElementById('modalCategoryTitle');
    
    var categoryName = categoryNames[category] || category;
    titleElement.innerText = categoryName + " একাউন্ট তালিকা";
    listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">লোডিং...</p>';

    document.getElementById('accountListModal').style.display = 'flex';

    fetch('/api/products/' + category)
        .then(function(res) { return res.json(); })
        .then(function(list) {
            listContainer.innerHTML = '';
            if (!list || list.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">কোনো একাউন্ট উপলব্ধ নেই</p>';
                return;
            }
            
            for (var i = 0; i < list.length; i++) {
                (function() {
                    var acc = list[i];
                    var item = document.createElement('div');
                    item.className = 'acc-item';
                    item.onclick = function(e) {
                        if (e) {
                            e.stopPropagation();
                        }
                        openBuyInterface(acc);
                    };
                    item.innerHTML = '<div class="acc-info">' +
                        '<h4>' + acc.title + '</h4>' +
                        '<p>আইডি: ' + acc.id + ' | পাসওয়ার্ড: ••••••••</p>' +
                        '</div>' +
                        '<div class="acc-price">' + acc.price + ' ৳</div>';
                    listContainer.appendChild(item);
                })();
            }
        })
        .catch(function() {
            listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">লোডিং সমস্যা হয়েছে</p>';
        });
}

// ক্রয়কৃত একাউন্টসমূহের তালিকা প্রদর্শন
function showPurchasedAccounts(event) {
    if (event) {
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }
    }

    var listContainer = document.getElementById('accountListContainer');
    var titleElement = document.getElementById('modalCategoryTitle');
    
    titleElement.innerText = "আপনার ক্রয়কৃত একাউন্টস";
    listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">লোডিং...</p>';

    document.getElementById('accountListModal').style.display = 'flex';

    var userId = window.Telegram.WebApp.initDataUnsafe.user ? window.Telegram.WebApp.initDataUnsafe.user.id : 0;

    fetch('/api/orders/' + userId)
        .then(function(res) { return res.json(); })
        .then(function(list) {
            listContainer.innerHTML = '';
            if (!list || list.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">আপনার কোনো ক্রয়কৃত একাউন্ট নেই</p>';
                return;
            }
            
            for (var i = 0; i < list.length; i++) {
                var acc = list[i];
                var isApproved = acc.status === "approved" || acc.status === "Approved";
                
                var statusBadge = '';
                if (isApproved) {
                    statusBadge = '<span style="color: #2ecc71; font-weight: bold; font-size: 0.8rem; background: #e8f8f5; padding: 3px 8px; border-radius: 4px;">Approved ✔</span>';
                } else if (acc.status === "rejected" || acc.status === "Rejected") {
                    statusBadge = '<span style="color: #e74c3c; font-weight: bold; font-size: 0.8rem; background: #fce8e6; padding: 3px 8px; border-radius: 4px;">Rejected ❌</span>';
                } else {
                    statusBadge = '<span style="color: #e67e22; font-weight: bold; font-size: 0.8rem; background: #fdf2e9; padding: 3px 8px; border-radius: 4px;">Pending ⏳</span>';
                }
                
                var pwdDisplay = '';
                if (isApproved) {
                    pwdDisplay = '<strong style="color: #27ae60;">পাসওয়ার্ড/বিস্তারিত: ' + acc.details + '</strong>';
                } else {
                    pwdDisplay = '<span style="color: #888;">পাসওয়ার্ড: অনুমোদনের জন্য অপেক্ষা করুন</span>';
                }

                var item = document.createElement('div');
                item.className = 'acc-item';
                item.style.cursor = 'default';
                item.innerHTML = '<div class="acc-info" style="width: 100%;">' +
                    '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">' +
                        '<h4 style="margin: 0; color: #333;">' + acc.title + '</h4>' +
                        statusBadge +
                    '</div>' +
                    '<p style="margin: 2px 0;">আইডি: ' + acc.id + ' | মূল্য: ' + acc.price + ' ৳</p>' +
                    '<p style="margin-top: 8px; font-size: 0.85rem; background: #f1f2f6; padding: 6px 10px; border-radius: 6px;">' +
                        pwdDisplay +
                    '</p>' +
                '</div>';
                
                listContainer.appendChild(item);
            }
        })
        .catch(function() {
            listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">লোডিং সমস্যা হয়েছে</p>';
        });
}

// ক্রয়ের জন্য ইন্টারফেস চালু করা
function openBuyInterface(acc) {
    selectedAccount = acc;
    
    closeCustomModal('accountListModal');

    document.getElementById('buyAccId').innerText = acc.id;
    document.getElementById('buyAccName').innerText = acc.title;
    document.getElementById('buyAccPrice').innerText = acc.price + " ৳";
    document.getElementById('paymentMethod').value = "";

    // ট্রানজেকশন ফিল্ড ও ইনপুট রিসেট করা হচ্ছে
    var manualDiv = document.getElementById('manualPaymentDetails');
    if (manualDiv) {
        manualDiv.style.display = 'none';
    }
    var trxInput = document.getElementById('transactionIdInput');
    if (trxInput) {
        trxInput.value = "";
    }

    document.getElementById('accountBuyModal').style.display = 'flex';
}

// পেমেন্ট পদ্ধতি অনুযায়ী ইনপুট ফিল্ড প্রদর্শন বা লুকানোর ফাংশন
function toggleManualPaymentFields() {
    var method = document.getElementById('paymentMethod').value;
    var manualDiv = document.getElementById('manualPaymentDetails');
    if (!manualDiv) return;

    if (method === 'bkash' || method === 'nagad' || method === 'rocket') {
        manualDiv.style.display = 'block';
    } else {
        manualDiv.style.display = 'none';
    }
}

// মডাল বন্ধ করার ফাংশন
function closeCustomModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ক্রয় প্রক্রিয়া সম্পন্ন করার বোতামের কাজ
function confirmPurchase(event) {
    if (event) {
        event.stopPropagation();
    }

    var method = document.getElementById('paymentMethod').value;
    if (!method) {
        alert("অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন!");
        return;
    }

    // ট্রানজেকশন আইডি চেক
    var transactionId = "";
    if (method === 'bkash' || method === 'nagad' || method === 'rocket') {
        var trxInput = document.getElementById('transactionIdInput');
        transactionId = trxInput ? trxInput.value.trim() : "";
        if (!transactionId) {
            alert("অনুগ্রহ করে ট্রানজেকশন আইডি (Transaction ID) প্রদান করুন!");
            return;
        }
    }
    
    var userId = window.Telegram.WebApp.initDataUnsafe.user ? window.Telegram.WebApp.initDataUnsafe.user.id : 0;
    if (!userId) {
        alert("ইউজার সনাক্ত করা যায়নি!");
        return;
    }

    var submitBtn = document.querySelector('.buy-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "প্রসেসিং...";

    fetch('/api/buy-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: userId,
            productId: selectedAccount.id,
            paymentMethod: method,
            transactionId: transactionId // সার্ভারে পাঠানো হচ্ছে
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        submitBtn.disabled = false;
        submitBtn.innerText = "ক্রয় সম্পন্ন করুন";
        
        if (data.success) {
            alert(data.message);
            closeCustomModal('accountBuyModal');
            if (typeof loadServicePageData === 'function') {
                loadServicePageData();
            }
        } else {
            alert(data.message || "ক্রয় করতে ব্যর্থ হয়েছে!");
        }
    })
    .catch(function() {
        submitBtn.disabled = false;
        submitBtn.innerText = "ক্রয় সম্পন্ন করুন";
        alert("সার্ভারে সমস্যা হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।");
    });
}

// গ্লোবাল উইন্ডো স্কোপে ফাংশন বাইন্ডিং
window.showAccounts = showAccounts;
window.showPurchasedAccounts = showPurchasedAccounts;
window.closeCustomModal = closeCustomModal;
window.confirmPurchase = confirmPurchase;
window.toggleManualPaymentFields = toggleManualPaymentFields;