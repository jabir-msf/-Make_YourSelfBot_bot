const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// অ্যাপটি বড় করে ওপেন করা
tg.expand();

async function loadWithdrawalHistory() {
    if (!user) return;

    try {
        // ১. সার্ভার থেকে উইথড্র ডাটা নিয়ে আসা
        const response = await fetch(`/api/withdrawals/${user.id}`);
        const dataList = await response.json();
        
        const container = document.getElementById('historyContainer');
        container.innerHTML = ''; // লোডিং মেসেজ মুছে ফেলা

        if (dataList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #777; margin-top: 50px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>আপনি এখনো কোনো উত্তোলন করেননি।</p>
                </div>`;
            return;
        }

        // ২. প্রতিটি ডাটার জন্য একটি করে কার্ড তৈরি করা
        dataList.forEach(item => {
            let statusText = "পেন্ডিং";
            let statusClass = "badge-blue"; // ডিফল্ট পেন্ডিং এর জন্য (CSS এ যোগ করতে পারেন)
            let borderClass = "border-blue";
            let statusIcon = "fa-clock";

            if (item.status === 'approved') {
                statusText = "অনুমোদিত";
                statusClass = "badge-green";
                borderClass = "border-green";
                statusIcon = "fa-check";
            } else if (item.status === 'cancelled') {
                statusText = "বাতিল";
                statusClass = "badge-red";
                borderClass = "border-red";
                statusIcon = "fa-xmark";
            }

            // তারিখ ফরম্যাট করা (বাংলায়)
            const date = new Date(item.created_at).toLocaleString('bn-BD', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const cardHTML = `
                <div class="history-card ${borderClass}">
                    <div class="card-left">
                        <div class="${item.status === 'cancelled' ? 'icon-box-red' : 'icon-box-blue'}">
                            <i class="fa-solid fa-arrow-down"></i>
                        </div>
                    </div>
                    <div class="card-center">
                        <h4 class="req-title">উত্তোলন অনুরোধ</h4>
                        <p class="details">${item.method.toUpperCase()} • ${item.account_no}</p>
                        <span class="status-badge ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i> ${statusText}
                        </span>
                        <div class="date-time">
                            <i class="fa-regular fa-calendar-days"></i>
                            ${date}
                        </div>
                    </div>
                    <div class="card-right">
                        <span class="amount" style="color: ${item.status === 'cancelled' ? '#ff4757' : '#2ecc71'}">-৳${parseFloat(item.amount).toFixed(0)}</span>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (err) {
        console.error("History Load Error:", err);
        document.getElementById('historyContainer').innerHTML = "<p style='text-align:center;'>তথ্য পেতে সমস্যা হচ্ছে।</p>";
    }
}

// টেলিগ্রামের ব্যাক বাটন সচল করা
tg.BackButton.show();
tg.BackButton.onClick(() => {
    history.back();
});

// পেজ লোড হলে ডাটা আনা শুরু করবে
loadWithdrawalHistory();
