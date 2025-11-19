import { stateService } from './services/state.service.js';

// Function to update item quantity
function updateItemQuantity(itemIndex, newQuantity) {
    if (newQuantity <= 0) {
        removeItem(itemIndex);
        return;
    }
    
    stateService.cart[itemIndex].quantity = newQuantity;
    checkItem();
}

// Function to remove item from cart
function removeItem(itemIndex) {
    stateService.cart.splice(itemIndex, 1);
    checkItem();
}

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
    cart.forEach(function(item, index) {
        var itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="order-item-card">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-unit-price">₱${item.price} each</span>
                </div>
                <div class="item-controls">
                    <button class="qty-btn minus-btn" onclick="window.decreaseQuantity(${index})" title="Decrease quantity">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="qty-btn plus-btn" onclick="window.increaseQuantity(${index})" title="Increase quantity">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="item-price">₱${itemTotal}</span>
                <button class="remove-btn" onclick="window.removeItemCart(${index})" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    orderItemsContainer.innerHTML = html;
    document.getElementById('totalAmount').textContent = '₱' + total;
}

// Global functions for onclick handlers
window.increaseQuantity = function(index) {
    stateService.cart[index].quantity += 1;
    checkItem();
};

window.decreaseQuantity = function(index) {
    if (stateService.cart[index].quantity > 1) {
        stateService.cart[index].quantity -= 1;
    } else {
        removeItem(index);
    }
    checkItem();
};

window.removeItemCart = function(index) {
    removeItem(index);
};

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