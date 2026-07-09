
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

async function loadWorkHistory() {
    if (!user) return;

    try {
        // সার্ভার থেকে কাজের ডাটা আনা (আপনার API অনুযায়ী)
        const response = await fetch(`/api/tasks/history/${user.id}`);
        const tasks = await response.json();
        
        const container = document.getElementById('taskHistoryContainer');
        container.innerHTML = ''; 

        if (tasks.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #777; margin-top: 50px;">
                <p>আপনি এখনো কোনো কাজ সম্পন্ন করেননি।</p></div>`;
            return;
        }

        tasks.forEach(task => {
            let statusText = "পেন্ডিং";
            let statusClass = "badge-blue"; 
            let borderClass = "border-blue";

            if (task.status === 'approved') {
                statusText = "সম্পন্ন";
                statusClass = "badge-green";
                borderClass = "border-green";
            } else if (task.status === 'rejected') {
                statusText = "বাতিল";
                statusClass = "badge-red";
                borderClass = "border-red";
            }

            const cardHTML = `
                <div class="history-card ${borderClass}" style="margin-bottom: 10px; background: white; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div>
                        <h4 style="margin: 0; font-size: 16px;">${task.task_name}</h4>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">${new Date(task.created_at).toLocaleString('bn-BD')}</p>
                        <span class="status-badge ${statusClass}" style="font-size: 11px; padding: 2px 8px; border-radius: 5px;">${statusText}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: bold; color: #2ecc71;">+৳${task.amount}</span>
                    </div>
                </div>`;
            container.innerHTML += cardHTML;
        });

    } catch (err) {
        document.getElementById('taskHistoryContainer').innerHTML = "<p style='text-align:center;'>তথ্য লোড করতে সমস্যা হয়েছে।</p>";
    }
}

tg.BackButton.show();
tg.BackButton.onClick(() => history.back());
loadWorkHistory();
