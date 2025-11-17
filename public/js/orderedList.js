import { stateService } from './services/state.service.js';

// Dynamically read stateService for any items and render order
function checkItem() {
    const cart = stateService.cart;
    console.log('Cart on orderedList.html load:', cart);
    console.log('stateService.cart content:', stateService.cart);
    var total = 0;
    var orderItemsContainer = document.getElementById('orderItems');

    if (!cart || cart.length === 0) {
        orderItemsContainer.innerHTML = '<div class="empty-message">No items in your order. Please go back and select items.</div>';
        document.getElementById('totalAmount').textContent = '₱0';
        return;
    }

    var html = '';
    cart.forEach(function(item) {
        var itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += '<div class="order-item"><span class="item-name">' + item.name + ' x ' + item.quantity + '</span><span class="item-price">₱' + itemTotal + '</span></div>';
    });

    orderItemsContainer.innerHTML = html;
    document.getElementById('totalAmount').textContent = '₱' + total;
}

// Initialize on DOMContentLoaded, not load (prevents duplicate execution)
document.addEventListener('DOMContentLoaded', function() {
    checkItem();
    
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            // Clear cart before navigating back to prevent duplicate items
            stateService.clearCart();
            window.location.href = 'menu.html';
        });
    }
});