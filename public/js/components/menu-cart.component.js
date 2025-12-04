// Menu Cart Component - Shopping cart sidebar in the menu page
import { stateService } from '../services/state.service.js';
import { uiUtils } from '../utils/ui.utils.js';

class MenuCartComponent {
    constructor(cartContainerId = 'menu-cart-modal') {
        this.containerId = cartContainerId;
        this.container = null;
        this.init();
    }

    init() {
        // Create cart modal if it doesn't exist
        if (!document.getElementById(this.containerId)) {
            this.createCartModal();
        }
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

    createCartModal() {
        const modalHTML = `
            <div id="${this.containerId}" class="menu-cart-modal">
                <div class="menu-cart-overlay"></div>
                <div class="menu-cart-panel">
                    <div class="menu-cart-header">
                        <h2>Shopping Cart</h2>
                        <button class="menu-cart-close-btn" aria-label="Close cart">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="menu-cart-body">
                        <div id="menu-cart-items"></div>
                    </div>
                    <div class="menu-cart-footer">
                        <div class="menu-cart-total">
                            <span>Total:</span>
                            <span id="menu-cart-total-price" class="menu-cart-price">₱0.00</span>
                        </div>
                        <div class="menu-cart-actions">
                            <button id="menu-cart-clear-btn" class="menu-cart-btn menu-cart-btn-secondary">
                                Clear Cart
                            </button>
                            <button id="menu-cart-checkout-btn" class="menu-cart-btn menu-cart-btn-primary">
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        const modal = document.getElementById(this.containerId);
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.menu-cart-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCart());
        }

        // Overlay click
        const overlay = modal.querySelector('.menu-cart-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeCart());
        }

        // Clear cart button
        const clearBtn = document.getElementById('menu-cart-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCart());
        }

        // Checkout button
        const checkoutBtn = document.getElementById('menu-cart-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Delegate events for cart items
        const itemsContainer = document.getElementById('menu-cart-items');
        if (itemsContainer) {
            itemsContainer.addEventListener('click', (e) => {
                const target = e.target.closest('.menu-cart-item-btn');
                if (!target) return;

                const cartItemId = target.dataset.cartItemId;
                
                if (target.classList.contains('menu-cart-remove-btn')) {
                    this.removeItem(cartItemId);
                } else if (target.classList.contains('menu-cart-qty-decrease')) {
                    this.updateQuantity(cartItemId, -1);
                } else if (target.classList.contains('menu-cart-qty-increase')) {
                    this.updateQuantity(cartItemId, 1);
                }
            });

            // Edit variations button
            itemsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.menu-cart-edit-variations-btn')) {
                    const cartItemId = e.target.closest('.menu-cart-edit-variations-btn').dataset.cartItemId;
                    this.editVariations(cartItemId);
                }
            });
        }
    }

    openCart() {
        const modal = document.getElementById(this.containerId);
        if (modal) {
            modal.classList.add('menu-cart-active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        const modal = document.getElementById(this.containerId);
        if (modal) {
            modal.classList.remove('menu-cart-active');
            document.body.style.overflow = '';
        }
    }

    removeItem(cartItemId) {
        stateService.removeFromCart(cartItemId);
        uiUtils.showAlert('Item removed from cart', 'success');
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
            uiUtils.showAlert('Cart cleared', 'success');
        }
    }

    proceedToCheckout() {
        const cart = stateService.cart;
        if (cart.length === 0) {
            uiUtils.showAlert('Your cart is empty. Please add items first.', 'warning');
            return;
        }
        
        this.closeCart();
        window.location.href = 'orderedList.html';
    }

    editVariations(cartItemId) {
        // This would open a modal to edit variations for a specific cart item
        // For now, we'll just show a placeholder
        const cart = stateService.cart;
        const item = cart.find(i => i.id === cartItemId);
        
        if (!item) return;

        alert(`Edit variations for "${item.name}"\n\nThis feature will allow you to change variations for this item.`);
    }

    calculateTotal() {
        return stateService.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    render() {
        const cart = stateService.cart;
        const total = this.calculateTotal();
        const itemsContainer = document.getElementById('menu-cart-items');
        const totalPriceElem = document.getElementById('menu-cart-total-price');
        const checkoutBtn = document.getElementById('menu-cart-checkout-btn');

        if (!itemsContainer) return;

        // Render cart items
        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="menu-cart-empty">
                    <div class="menu-cart-empty-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <p class="menu-cart-empty-text">Your cart is empty</p>
                    <p class="menu-cart-empty-subtext">Add items from the menu to get started</p>
                </div>
            `;
        } else {
            itemsContainer.innerHTML = cart.map((item) => `
                <div class="menu-cart-item" data-cart-item-id="${item.id}">
                    <div class="menu-cart-item-content">
                        <div class="menu-cart-item-name">${item.name}</div>
                        ${item.selectedVariations && item.selectedVariations.length > 0 ? `
                            <div class="menu-cart-item-variations">
                                ${item.selectedVariations.map(v => `
                                    <span class="menu-cart-variation-badge">
                                        ${v.variationName}: <strong>${v.selectedOption}</strong>
                                    </span>
                                `).join('')}
                            </div>
                            <button class="menu-cart-edit-variations-btn menu-cart-item-btn" 
                                    data-cart-item-id="${item.id}" 
                                    title="Edit variations">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <div class="menu-cart-item-price">₱${item.price.toFixed(2)}</div>
                    </div>
                    <div class="menu-cart-item-controls">
                        <button class="menu-cart-qty-decrease menu-cart-item-btn" 
                                data-cart-item-id="${item.id}" 
                                title="Decrease quantity">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="menu-cart-qty">${item.quantity}</span>
                        <button class="menu-cart-qty-increase menu-cart-item-btn" 
                                data-cart-item-id="${item.id}" 
                                title="Increase quantity">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="menu-cart-remove-btn menu-cart-item-btn" 
                                data-cart-item-id="${item.id}" 
                                title="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Update total price
        if (totalPriceElem) {
            totalPriceElem.textContent = `₱${total.toFixed(2)}`;
        }

        // Update checkout button disabled state
        if (checkoutBtn) {
            if (cart.length === 0) {
                checkoutBtn.disabled = true;
            } else {
                checkoutBtn.disabled = false;
            }
        }
    }
}

export default MenuCartComponent;
