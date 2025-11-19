import { stateService } from './services/state.service.js';

// Function to remove item from cart
function removeItem(itemIndex) {
    console.log('Removing item at index:', itemIndex);
    console.log('Cart before removal:', stateService.cart);
    
    if (itemIndex >= 0 && itemIndex < stateService.cart.length) {
        stateService.cart.splice(itemIndex, 1);
        console.log('Cart after removal:', stateService.cart);
        checkItem();
    } else {
        console.error('Invalid item index:', itemIndex);
    }
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
                    <button class="qty-btn minus-btn" data-action="decrease" data-index="${index}" title="Decrease quantity">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="qty-btn plus-btn" data-action="increase" data-index="${index}" title="Increase quantity">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="item-price">₱${itemTotal}</span>
                <button class="remove-btn" data-action="remove" data-index="${index}" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    orderItemsContainer.innerHTML = html;
    document.getElementById('totalAmount').textContent = '₱' + total;
    
    // Rebind event listeners after re-rendering
    bindQuantityButtons();
}

// Function to handle all button clicks with event delegation
function bindQuantityButtons() {
    const orderItemsContainer = document.getElementById('orderItems');
    
    orderItemsContainer.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const index = parseInt(button.getAttribute('data-index'));
        
        console.log('Button clicked - Action:', action, 'Index:', index);
        
        if (action === 'increase') {
            if (stateService.cart[index]) {
                stateService.cart[index].quantity += 1;
                checkItem();
            }
        } else if (action === 'decrease') {
            if (stateService.cart[index]) {
                if (stateService.cart[index].quantity > 1) {
                    stateService.cart[index].quantity -= 1;
                    checkItem();
                } else {
                    removeItem(index);
                }
            }
        } else if (action === 'remove') {
            removeItem(index);
        }
    });
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