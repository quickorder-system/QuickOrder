let quantityButtonsListener = null; // Store reference to event listener
let appliedDiscount = null; // Store applied discount

// Function to remove item from cart
function removeItem(itemIndex) {
    console.log('Removing item at index:', itemIndex);
    console.log('Cart before removal:', stateService.cart);
    
    if (itemIndex >= 0 && itemIndex < stateService.cart.length) {
        const updatedCart = stateService.cart;
        updatedCart.splice(itemIndex, 1);
        stateService.updateCart(updatedCart);
        console.log('Cart after removal:', stateService.cart);
        checkItem();
    } else {
        console.error('Invalid item index:', itemIndex);
    }
}

// Calculate total with discount
function calculateTotal() {
    const cart = stateService.cart;
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    let total = subtotal;
    let discountAmount = 0;
    
    if (appliedDiscount) {
        if (appliedDiscount.discountType === 'percentage') {
            discountAmount = (subtotal * appliedDiscount.discountValue) / 100;
        } else if (appliedDiscount.discountType === 'fixed') {
            discountAmount = appliedDiscount.discountValue;
        }
        
        // Apply max discount cap if set
        if (appliedDiscount.maxDiscountAmount && discountAmount > appliedDiscount.maxDiscountAmount) {
            discountAmount = appliedDiscount.maxDiscountAmount;
        }
        
        total = subtotal - discountAmount;
    }
    
    return { subtotal, discountAmount, total };
}

// Dynamically read stateService for any items and render order
function checkItem() {
    const cart = stateService.cart;
    console.log('Cart on orderedList.html load:', cart);
    console.log('stateService.cart content:', stateService.cart);
    
    const { subtotal, discountAmount, total } = calculateTotal();
    var orderItemsContainer = document.getElementById('orderItems');

    if (!cart || cart.length === 0) {
        orderItemsContainer.innerHTML = '<div class="empty-message">No items in your order. Please go back and select items.</div>';
        document.getElementById('totalAmount').textContent = '₱0';
        return;
    }

    var html = '';
    cart.forEach(function(item, index) {
        var itemTotal = item.price * item.quantity;
        
        // Display variants if they exist
        const variantsHTML = item.selectedVariations && item.selectedVariations.length > 0 
            ? `<div class="item-variants">${item.selectedVariations.map(v => `<span class="variant-badge">${v.variationName}: ${v.selectedOption}</span>`).join('')}</div>`
            : '';
        
        html += `
            <div class="order-item-card">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    ${variantsHTML}
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
    
    // Update total display
    if (appliedDiscount) {
        document.getElementById('totalAmount').innerHTML = `
            <div class="price-breakdown">
                <div class="price-line">
                    <span>Subtotal</span>
                    <span>₱${subtotal}</span>
                </div>
                <div class="price-line discount">
                    <span>Discount (${appliedDiscount.code})</span>
                    <span>-₱${discountAmount.toFixed(2)}</span>
                </div>
                <div class="price-line total">
                    <span>TOTAL</span>
                    <span>₱${total.toFixed(2)}</span>
                </div>
            </div>
        `;
    } else {
        document.getElementById('totalAmount').textContent = '₱' + total;
    }
    
    // Rebind event listeners after re-rendering
    bindQuantityButtons();
}

// Function to handle all button clicks with event delegation
function bindQuantityButtons() {
    const orderItemsContainer = document.getElementById('orderItems');
    
    // Remove old listener if it exists
    if (quantityButtonsListener) {
        orderItemsContainer.removeEventListener('click', quantityButtonsListener);
    }
    
    // Create new listener function
    quantityButtonsListener = function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const index = parseInt(button.getAttribute('data-index'));
        
        console.log('Button clicked - Action:', action, 'Index:', index);
        
        const cart = stateService.cart;
        
        if (action === 'increase') {
            if (cart[index]) {
                cart[index].quantity += 1;
                stateService.updateCart(cart);
                checkItem();
            }
        } else if (action === 'decrease') {
            if (cart[index]) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                    stateService.updateCart(cart);
                    checkItem();
                } else {
                    removeItem(index);
                }
            }
        } else if (action === 'remove') {
            removeItem(index);
        }
    };
    
    // Add the new listener
    orderItemsContainer.addEventListener('click', quantityButtonsListener);
}

// Initialize discount UI
async function initializeDiscountUI() {
    const discountSection = document.getElementById('discountSection');
    if (!discountSection) return;
    
    const html = discountUIUtils.createDiscountInputSection();
    discountSection.innerHTML = html;
    
    // Bind apply button
    const applyBtn = document.getElementById('applyDiscountBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', handleApplyDiscount);
    }

    // Load and display eligible automatic discounts
    try {
        const eligibleData = await customerService.getEligibleDiscounts();
        if (eligibleData && eligibleData.discounts && eligibleData.discounts.length > 0) {
            displayEligibleDiscounts(eligibleData.discounts);
        }
    } catch (error) {
        console.log('No eligible discounts available:', error.message);
    }

    // Bind automatic discount selection
    const discountRadios = document.querySelectorAll('input[name="automaticDiscount"]');
    discountRadios.forEach(radio => {
        radio.addEventListener('change', handleSelectAutomaticDiscount);
    });
}

// Display eligible discounts
function displayEligibleDiscounts(discounts) {
    const container = document.getElementById('automaticDiscountsContainer');
    const listContainer = document.getElementById('eligibleDiscountsList');
    
    if (!container || !listContainer) return;

    if (discounts.length === 0) {
        container.style.display = 'none';
        return;
    }

    // Create HTML for each eligible discount
    let html = '';
    discounts.forEach(discount => {
        html += discountUIUtils.createEligibleDiscountOption(discount);
    });

    listContainer.innerHTML = html;
    container.style.display = 'block';

    // Re-bind radio button change events
    const radios = listContainer.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('change', handleSelectAutomaticDiscount);
    });
}

// Handle automatic discount selection
async function handleSelectAutomaticDiscount(e) {
    const radio = e.target;
    const discountType = radio.getAttribute('data-discount-type');
    const discountCode = radio.getAttribute('data-discount-code');
    
    try {
        const { subtotal } = calculateTotal();
        const response = await discountService.applyAutomaticDiscount(discountType, subtotal);
        
        appliedDiscount = response.discount;
        stateService.setAppliedDiscount(appliedDiscount);
        
        // Hide manual input when automatic discount is selected
        document.getElementById('discountCode').style.display = 'none';
        document.getElementById('applyDiscountBtn').style.display = 'none';
        
        // Show applied discount display
        updateAppliedDiscountDisplay(appliedDiscount);
        
        const discountAmount = appliedDiscount.discountAmount || 0;
        discountUIUtils.showMessage(`✓ ${discountType} discount applied! Saving ₱${discountAmount.toFixed(2)}`, 'success');
        checkItem();
    } catch (error) {
        console.error('Automatic discount error:', error);
        discountUIUtils.showMessage(error.message || 'Failed to apply discount', 'error');
        e.target.checked = false;
        appliedDiscount = null;
    }
}

// Update applied discount display
function updateAppliedDiscountDisplay(discount) {
    const displayDiv = document.getElementById('appliedDiscountDisplay');
    const codeSpan = document.getElementById('appliedCode');
    const amountSpan = document.getElementById('discountAmount');
    const removeBtn = document.getElementById('removeDiscountBtn');

    if (!displayDiv) return;

    const discountAmount = discount.discountAmount || 0;
    codeSpan.textContent = `${discount.code}`;
    amountSpan.textContent = `- ₱${discountAmount.toFixed(2)}`;

    displayDiv.style.display = 'block';

    if (removeBtn) {
        removeBtn.onclick = handleRemoveDiscount;
    }
}

// Handle discount removal
function handleRemoveDiscount() {
    appliedDiscount = null;
    stateService.setAppliedDiscount(null);
    
    // Reset UI
    document.getElementById('discountCode').value = '';
    document.getElementById('discountCode').disabled = false;
    document.getElementById('discountCode').style.display = 'inline-block';
    document.getElementById('applyDiscountBtn').style.display = 'inline-block';
    document.getElementById('appliedDiscountDisplay').style.display = 'none';
    
    // Uncheck all discount radios
    document.querySelectorAll('input[name="automaticDiscount"]').forEach(radio => {
        radio.checked = false;
    });
    
    discountUIUtils.showMessage('Discount removed', 'success');
    checkItem();
}

// Handle manual discount application
async function handleApplyDiscount() {
    const codeInput = document.getElementById('discountCode');
    const code = codeInput?.value?.trim();
    
    if (!code) {
        discountUIUtils.showMessage('Please enter a discount code', 'error');
        return;
    }
    
    try {
        const { subtotal } = calculateTotal();
        const response = await discountService.validateCode(code, subtotal);
        
        // Extract discount data from response
        const discountData = response.discount || response;
        
        appliedDiscount = discountData;
        stateService.setAppliedDiscount(discountData);
        
        codeInput.disabled = true;
        document.getElementById('applyDiscountBtn').style.display = 'none';
        
        // Uncheck automatic discount radios
        document.querySelectorAll('input[name="automaticDiscount"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Show applied discount display
        updateAppliedDiscountDisplay(appliedDiscount);
        
        const discountAmount = appliedDiscount.discountAmount || 0;
        discountUIUtils.showMessage(`✓ Discount applied! Saving ₱${discountAmount.toFixed(2)}`, 'success');
        checkItem();
    } catch (error) {
        console.error('Discount error:', error);
        discountUIUtils.showMessage(error.message || 'Invalid discount code', 'error');
        appliedDiscount = null;
    }
}

// Initialize on DOMContentLoaded, not load (prevents duplicate execution)
document.addEventListener('DOMContentLoaded', function() {
    checkItem();
    initializeDiscountUI();
    
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            // Clear cart before navigating back to prevent duplicate items
            stateService.clearCart();
            appliedDiscount = null;
            window.location.href = 'menu.html';
        });
    }
});