// ES5 সমর্থিত ভেরিয়েবল ও অবজেক্ট ডিফাইন
var accountsData = {
    gmail: [
        { id: "G-101", name: "Gmail - পুরাতন সচল একাউন্ট (2021)", price: "৫০ ৳" },
        { id: "G-102", name: "Gmail - ভেরিফাইড নতুন একাউন্ট", price: "৩০ ৳" }
    ],
    tiktok: [
        { id: "T-201", name: "Tiktok - 1K অর্গানিক ফলোয়ার", price: "৩০০ ৳" },
        { id: "T-202", name: "Tiktok - ফ্রেশ নতুন আইডি", price: "২০ ৳" }
    ],
    fb: [
        { id: "F-301", name: "Facebook - ২-ফ্যাক্টর ভেরিফাইড", price: "৮০ ৳" },
        { id: "F-302", name: "Facebook Page - ৫কে ফলোয়ার", price: "৮০০ ৳" }
    ],
    insta: [
        { id: "I-401", name: "Instagram - পুরাতন একটিভ আইডি", price: "১৫০ ৳" }
    ],
    telegram: [
        { id: "TL-501", name: "Telegram - ওল্ড অ্যাকাউন্ট", price: "৭০ ৳" }
    ],
    whatsapp: [
        { id: "W-601", name: "WhatsApp - ইউএসএ ভার্চুয়াল নম্বর", price: "১২০ ৳" }
    ]
};

var purchasedAccounts = [
    { id: "G-101", name: "Gmail - পুরাতন সচল একাউন্ট (2021)", price: "৫০ ৳", status: "Approved", password: "GmailPassword123" },
    { id: "T-201", name: "Tiktok - 1K অর্গানিক ফলোয়ার", price: "৩০০ ৳", status: "Pending", password: "অনুমোদনের পর দেখা যাবে" }
];

var categoryNames = {
    gmail: "Gmail",
    tiktok: "Tiktok",
    fb: "Facebook",
    insta: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp"
};

var selectedAccount = null;

// একাউন্ট তালিকা প্রদর্শন
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
    listContainer.innerHTML = '';

    var list = accountsData[category] || [];

    if (list.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">কোনো একাউন্ট উপলব্ধ নেই</p>';
    } else {
        // ES5 closure ব্যবহার করে লুপ চালানো যাতে সঠিক ডাটা এসাইন হয়
        for (var i = 0; i < list.length; i++) {
            (function() {
                var acc = list[i];
                var item = document.createElement('div');
                item.className = 'acc-item';
                item.onclick = function(e) {
                    if (e) {
                        e.stopPropagation();
                        if (e.stopImmediatePropagation) {
                            e.stopImmediatePropagation();
                        }
                    }
                    openBuyInterface(acc);
                };
                item.innerHTML = '<div class="acc-info">' +
                    '<h4>' + acc.name + '</h4>' +
                    '<p>আইডি: ' + acc.id + ' | পাসওয়ার্ড: ••••••••</p>' +
                    '</div>' +
                    '<div class="acc-price">' + acc.price + '</div>';
                listContainer.appendChild(item);
            })();
        }
    }

    document.getElementById('accountListModal').style.display = 'flex';
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
    listContainer.innerHTML = '';

    if (purchasedAccounts.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">আপনার কোনো ক্রয়কৃত একাউন্ট নেই</p>';
    } else {
        for (var i = 0; i < purchasedAccounts.length; i++) {
            var acc = purchasedAccounts[i];
            var isApproved = acc.status === "Approved";
            
            var statusBadge = '';
            if (isApproved) {
                statusBadge = '<span style="color: #2ecc71; font-weight: bold; font-size: 0.8rem; background: #e8f8f5; padding: 3px 8px; border-radius: 4px;">Approved ✔</span>';
            } else {
                statusBadge = '<span style="color: #e67e22; font-weight: bold; font-size: 0.8rem; background: #fdf2e9; padding: 3px 8px; border-radius: 4px;">Pending ⏳</span>';
            }
            
            var pwdDisplay = '';
            if (isApproved) {
                pwdDisplay = '<strong style="color: #27ae60;">পাসওয়ার্ড: ' + acc.password + '</strong>';
            } else {
                pwdDisplay = '<span style="color: #888;">পাসওয়ার্ড: অনুমোদনের জন্য অপেক্ষা করুন</span>';
            }

            var item = document.createElement('div');
            item.className = 'acc-item';
            item.style.cursor = 'default';
            item.onclick = function(e) {
                if (e) {
                    e.stopPropagation();
                    if (e.stopImmediatePropagation) {
                        e.stopImmediatePropagation();
                    }
                }
            };
            item.innerHTML = '<div class="acc-info" style="width: 100%;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">' +
                    '<h4 style="margin: 0; color: #333;">' + acc.name + '</h4>' +
                    statusBadge +
                '</div>' +
                '<p style="margin: 2px 0;">আইডি: ' + acc.id + ' | মূল্য: ' + acc.price + '</p>' +
                '<p style="margin-top: 8px; font-size: 0.85rem; background: #f1f2f6; padding: 6px 10px; border-radius: 6px;">' +
                    pwdDisplay +
                '</p>' +
            '</div>';
            
            listContainer.appendChild(item);
        }
    }

    document.getElementById('accountListModal').style.display = 'flex';
}

// ক্রয়ের জন্য ইন্টারফেস চালু করা
function openBuyInterface(acc) {
    selectedAccount = acc;
    
    closeCustomModal('accountListModal');

    document.getElementById('buyAccId').innerText = acc.id;
    document.getElementById('buyAccName').innerText = acc.name;
    document.getElementById('buyAccPrice').innerText = acc.price;
    document.getElementById('paymentMethod').value = "";

    document.getElementById('accountBuyModal').style.display = 'flex';
}

// মডাল বন্ধ করার ফাংশন
function closeCustomModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ক্রয় প্রক্রিয়া সম্পন্ন করার বোতামের কাজ
function confirmPurchase(event) {
    if (event) {
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }
    }

    var method = document.getElementById('paymentMethod').value;
    if (!method) {
        alert("অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন!");
        return;
    }
    
    purchasedAccounts.push({
        id: selectedAccount.id,
        name: selectedAccount.name,
        price: selectedAccount.price,
        status: "Pending",
        password: "অনুমোদনের পর দেখা যাবে"
    });

    alert("ক্রয় অনুরোধ গ্রহণ করা হয়েছে। আপনার পেমেন্ট যাচাইকরণের পর " + selectedAccount.id + " এর পাসওয়ার্ড প্রদর্শন করা হবে।");
    closeCustomModal('accountBuyModal');
}

// গ্লোবাল উইন্ডো স্কোপে ফাংশন বাইন্ডিং
window.showAccounts = showAccounts;
window.showPurchasedAccounts = showPurchasedAccounts;
window.closeCustomModal = closeCustomModal;
window.confirmPurchase = confirmPurchase;
