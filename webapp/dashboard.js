document.addEventListener('DOMContentLoaded', () => {
    // Refresh page
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => {
        location.reload();
    });

    // Box click effect
    const actionBoxes = document.querySelectorAll('.action-box');
    actionBoxes.forEach(box => {
        box.addEventListener('click', function() {
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "scale(1)";
            }, 100);
            
            const text = this.querySelector('p').innerText;
            console.log(text + " clicked");
        });
    });
});
