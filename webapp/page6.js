document.addEventListener('DOMContentLoaded', () => {
    // স্ক্রিনশটে থাকা ব্যাক বাটন কাজ করানোর জন্য
    const backBtn = document.querySelector('.back-btn');
    backBtn.addEventListener('click', () => {
        // আগের পেজে ফিরে যাওয়ার জন্য
        window.history.back();
    });

    // কার্ডগুলোতে ক্লিক করলে কোনো ইফেক্ট দিতে চাইলে এখানে কোড করা যাবে
    const cards = document.querySelectorAll('.history-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            console.log('তথ্য চেক করা হচ্ছে...');
        });
    });
});
