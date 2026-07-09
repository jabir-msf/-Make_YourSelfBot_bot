document.addEventListener('DOMContentLoaded', () => {
    
    // Refresh functionality
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => {
        location.reload();
    });

    // Touch Feedback for items
    const serviceItems = document.querySelectorAll('.service-item, .q-card');
    serviceItems.forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.transform = "scale(0.95)";
            this.style.transition = "0.1s";
        });
        
        item.addEventListener('touchend', function() {
            this.style.transform = "scale(1)";
        });

        item.addEventListener('click', function() {
            const name = this.innerText || this.querySelector('p').innerText;
            console.log("Navigating to: " + name);
        });
    });

});
