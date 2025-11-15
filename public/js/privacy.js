console.log('Privacy.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    const backBtn = document.getElementById('backBtn');
    console.log('Back button found:', backBtn);
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            console.log('Back button clicked');
            e.preventDefault();
            window.location.href = 'QuickOrder.html';
        });
    }
});
