// Import required services and utilities
import { stateService } from '../services/state.service.js';
import { apiService } from '../services/api.service.js';
import { uiUtils } from '../utils/ui.utils.js';

class CartComponent {
    constructor(cartContainerId) {
        this.container = document.getElementById(cartContainerId);
        if (!this.container) {
            throw new Error(`Cart container with id "${cartContainerId}" not found`);
        }

        this.bindEvents();
        this.render();

        // Subscribe to cart changes
        stateService.subscribe('cart', () => this.render());
    }

    bindEvents() {
        // Delegate events for cart items
        this.container.addEventListener('click', (e) => {
            const target = e.target;

            // Remove item button
            if (target.matches('.remove-item-btn')) {
                const itemId = target.dataset.itemId;
                this.removeItem(itemId);
            }

            // Update quantity buttons
            if (target.matches('.quantity-btn')) {
                const itemId = target.dataset.itemId;
                const change = parseInt(target.dataset.change);
                this.updateQuantity(itemId, change);
            }
        });
    }

    async removeItem(itemId) {
        try {
            stateService.removeFromCart(itemId);
            uiUtils.showAlert('Item removed from cart', 'success');
        } catch (error) {
            console.error('Error removing item:', error);
            uiUtils.showAlert('Failed to remove item', 'error');
        }
    }

    async updateQuantity(itemId, change) {
        const cart = stateService.cart;
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return;
        
        const newQuantity = Math.max(1, cart[itemIndex].quantity + change);
        const updatedCart = [...cart];
        updatedCart[itemIndex] = {
            ...updatedCart[itemIndex],
            quantity: newQuantity
        };

        stateService.setCart(updatedCart);
    }

    calculateTotal() {
        return stateService.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    render() {
        const cart = stateService.cart;
        const total = this.calculateTotal();

        this.container.innerHTML = `
            <div class="cart-items">
                ${cart.length === 0 ? this.renderEmptyCart() : this.renderCartItems(cart)}
            </div>
            <div class="cart-summary">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="font-bold">Total:</span>
                    <span class="font-bold">${uiUtils.formatCurrency(total)}</span>
                </div>
                ${this.renderCheckoutButton(cart)}
            </div>
        `;
    }

    renderEmptyCart() {
        return `
            <div class="text-center py-4">
                <div class="text-xl mb-2">Your cart is empty</div>
                <p class="text-secondary">Add some delicious items to get started!</p>
            </div>
        `;
    }

    renderCartItems(cart) {
        return cart.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    ${item.selectedVariations && item.selectedVariations.length > 0 ? `
                        <div class="cart-item-variations">
                            ${item.selectedVariations.map(v => `
                                <span class="variation-badge">${v.variationName}: ${v.selectedOption}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <p class="cart-item-price">${uiUtils.formatCurrency(item.price)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn btn-secondary" data-change="-1" data-item-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn btn-secondary" data-change="1" data-item-id="${item.id}">+</button>
                    <button class="remove-item-btn btn-danger" data-item-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCheckoutButton(cart) {
        const isDisabled = cart.length === 0;
        return `
            <button 
                class="btn btn-primary w-100 mt-3 ${isDisabled ? 'disabled' : ''}"
                ${isDisabled ? 'disabled' : ''}
                onclick="window.location.href='checkout.html'"
            >
                Proceed to Checkout
            </button>
        `;
    }
}

export default CartComponent;