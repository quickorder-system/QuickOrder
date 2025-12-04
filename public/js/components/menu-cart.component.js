// Menu Cart Component - Shopping cart sidebar in the menu page
import { stateService } from '../services/state.service.js';

class MenuCartComponent {
    constructor(cartContainerId = 'menu-cart-container') {
        this.containerId = cartContainerId;
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        
        if (!this.container) {
            console.error(`Cart container with id "${this.containerId}" not found`);
            return;
        }

        // Subscribe to cart changes
        stateService.subscribe('cart', () => this.render());
        
        // Bind events
        this.bindEvents();
        
        // Initial render
        this.render();
    }

    bindEvents() {
        const container = this.container;
        if (!container) return;

        // Delegate events for cart items
        container.addEventListener('click', (e) => {
            const target = e.target.closest('.order-cart-item-btn');
            if (!target) return;

            const cartItemId = target.dataset.cartItemId;
            
            if (target.classList.contains('order-cart-remove-btn')) {
                this.removeItem(cartItemId);
            } else if (target.classList.contains('order-cart-qty-decrease')) {
                this.updateQuantity(cartItemId, -1);
            } else if (target.classList.contains('order-cart-qty-increase')) {
                this.updateQuantity(cartItemId, 1);
            }
        });

        // Clear cart button
        const clearBtn = container.querySelector('.order-cart-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCart());
        }

        // Checkout button
        const checkoutBtn = container.querySelector('.order-cart-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }
    }

    removeItem(cartItemId) {
        stateService.removeFromCart(cartItemId);
        if (window.uiUtils) {
            window.uiUtils.showAlert('Item removed from cart', 'success');
        }
    }

    updateQuantity(cartItemId, change) {
        const cart = stateService.cart;
        const itemIndex = cart.findIndex(item => item.id === cartItemId);
        
        if (itemIndex === -1) return;
        
        const newQuantity = Math.max(1, cart[itemIndex].quantity + change);
        
        if (newQuantity !== cart[itemIndex].quantity) {
            const updatedCart = [...cart];
            updatedCart[itemIndex] = {
                ...updatedCart[itemIndex],
                quantity: newQuantity
            };
            stateService.updateCart(updatedCart);
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear the entire cart?')) {
            stateService.clearCart();
            if (window.uiUtils) {
                window.uiUtils.showAlert('Cart cleared', 'success');
            }
        }
    }

    proceedToCheckout() {
        const cart = stateService.cart;
        if (cart.length === 0) {
            if (window.uiUtils) {
                window.uiUtils.showAlert('Your cart is empty. Please add items first.', 'warning');
            }
            return;
        }
        
        window.location.href = 'orderedList.html';
    }

    calculateTotal() {
        return stateService.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    render() {
        const cart = stateService.cart;
        const total = this.calculateTotal();

        if (!this.container) return;

        // Render cart items
        if (cart.length === 0) {
            this.container.innerHTML = `
                <div class="order-cart-panel">
                    <div class="order-cart-header">
                        <h2>Order Cart</h2>
                    </div>
                    <div class="order-cart-body">
                        <div class="order-cart-empty">
                            <div class="order-cart-empty-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <p class="order-cart-empty-text">Your cart is empty</p>
                            <p class="order-cart-empty-subtext">Add items from the menu to get started</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            this.container.innerHTML = `
                <div class="order-cart-panel">
                    <div class="order-cart-header">
                        <h2>Order Cart</h2>
                    </div>
                    <div class="order-cart-body">
                        <div class="order-cart-items">
                            ${cart.map((item) => `
                                <div class="order-cart-item" data-cart-item-id="${item.id}">
                                    <div class="order-cart-item-content">
                                        <div class="order-cart-item-name">${item.name}</div>
                                        ${item.selectedVariations && item.selectedVariations.length > 0 ? `
                                            <div class="order-cart-item-variations">
                                                ${item.selectedVariations.map(v => `
                                                    <span class="order-cart-variation-badge">
                                                        ${v.variationName}: <strong>${v.selectedOption}</strong>
                                                    </span>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        <div class="order-cart-item-price">₱${item.price.toFixed(2)}</div>
                                    </div>
                                    <div class="order-cart-item-controls">
                                        <button class="order-cart-qty-decrease order-cart-item-btn" 
                                                data-cart-item-id="${item.id}" 
                                                title="Decrease quantity">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <span class="order-cart-qty">${item.quantity}</span>
                                        <button class="order-cart-qty-increase order-cart-item-btn" 
                                                data-cart-item-id="${item.id}" 
                                                title="Increase quantity">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <button class="order-cart-remove-btn order-cart-item-btn" 
                                                data-cart-item-id="${item.id}" 
                                                title="Remove item">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="order-cart-footer">
                        <div class="order-cart-total">
                            <span>Total:</span>
                            <span class="order-cart-price">₱${total.toFixed(2)}</span>
                        </div>
                        <div class="order-cart-actions">
                            <button type="button" class="order-cart-btn order-cart-btn-secondary order-cart-clear-btn">
                                Clear Cart
                            </button>
                            <button type="button" class="order-cart-btn order-cart-btn-primary order-cart-checkout-btn">
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

export default MenuCartComponent;
