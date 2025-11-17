// Order Management System
class OrderManagement {
    constructor() {
        this.initializeEventListeners();
        this.refreshOrders();
    }

    initializeEventListeners() {
        // Initialize search functionality
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Initialize status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }
    }

    handleSearch(searchTerm) {
        const orderCards = document.querySelectorAll('.order-card');
        orderCards.forEach(card => {
            const textContent = card.textContent.toLowerCase();
            const shouldShow = textContent.includes(searchTerm.toLowerCase());
            card.style.display = shouldShow ? '' : 'none';
        });
    }

    handleStatusFilter(status) {
        const orderCards = document.querySelectorAll('.order-card');
        orderCards.forEach(card => {
            if (status === 'all' || card.querySelector('.status-badge').textContent.toLowerCase() === status) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async refreshOrders() {
        try {
            const orders = await OrderService.getAllOrders();
            this.renderOrders(orders);
        } catch (error) {
            console.error('Failed to refresh orders:', error);
            this.showError('Failed to load orders. Please try again.');
        }
    }

    showError(message) {
        const ordersList = document.querySelector('.orders-list');
        if (ordersList) {
            ordersList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    ${message}
                </div>
            `;
        }
    }

    async updateOrderStatus(btn, status) {
        if (!btn || !(btn instanceof Element)) {
            console.error('Invalid button element:', btn);
            return;
        }
        
        const card = btn.closest('.order-card');
        if (!card) {
            console.error('Could not find order card');
            return;
        }

        const badge = card.querySelector('.status-badge');
        if (!badge) {
            console.error('Could not find status badge');
            return;
        }

        const orderId = card.dataset.orderId;
        if (!orderId) {
            console.error('Could not find order ID on card:', card);
            return;
        }

        // Disable all action buttons while processing
        const actionButtons = card.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => btn.disabled = true);

        try {
            const updatedOrder = await OrderService.updateOrderStatus(orderId, status);
            
            // Update the UI with the new status
            badge.textContent = status;
            badge.className = `status-badge ${status}`;
            
            // Hide irrelevant buttons based on new status
            if (status === 'complete' || status === 'cancelled') {
                card.querySelectorAll('.action-btn').forEach(btn => btn.style.display = 'none');
            } else {
                this.updateActionButtons(card, status);
            }
            
            // Update statistics if needed
            if (typeof updateStatistics === 'function') {
                updateStatistics();
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status. Please try again.');
        } finally {
            // Re-enable buttons
            actionButtons.forEach(btn => btn.disabled = false);
        }
    }

    cancelOrder(btn) {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        
        const card = btn.closest('.order-card');
        if (!card) return;

        const orderId = card.dataset.orderId;
        if (!orderId) {
            console.error('Could not find order ID on card:', card);
            return;
        }

        // Disable all action buttons while processing
        const actionButtons = card.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => btn.disabled = true);

        (async () => {
            try {
                const cancelledOrder = await OrderService.updateOrderStatus(orderId, 'cancelled');
                
                const badge = card.querySelector('.status-badge');
                if (badge) {
                    badge.textContent = 'Cancelled';
                    badge.className = 'status-badge cancelled';
                }
                // Hide all action buttons for cancelled order
                card.querySelectorAll('.action-btn').forEach(btn => btn.style.display = 'none');
                
                // Update statistics if needed
                if (typeof updateStatistics === 'function') {
                    updateStatistics();
                }

                // Fade out and remove card after animation
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 300);
            } catch (error) {
                console.error('Error cancelling order:', error);
                alert('Failed to cancel order. Please try again.');
                // Reset opacity if error occurs
                card.style.opacity = '1';
            } finally {
                // Re-enable buttons
                actionButtons.forEach(btn => btn.disabled = false);
            }
        })();
    }

    updateActionButtons(card, status) {
        const actionsDiv = card.querySelector('.order-actions');
        if (!actionsDiv) return;

        switch (status) {
            case 'pending':
                actionsDiv.innerHTML = `
                    <button class="action-btn prepare" onclick="orderManagement.updateOrderStatus(this, 'preparing')">
                        <i class="fas fa-utensils"></i>
                        Start Preparing
                    </button>
                    <button class="action-btn cancel" onclick="orderManagement.cancelOrder(this)">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                `;
                break;
            case 'preparing':
                actionsDiv.innerHTML = `
                    <button class="action-btn ready" onclick="orderManagement.updateOrderStatus(this, 'ready')">
                        <i class="fas fa-check-double"></i>
                        Mark as Ready
                    </button>
                    <button class="action-btn cancel" onclick="orderManagement.cancelOrder(this)">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                `;
                break;
            case 'ready':
                actionsDiv.innerHTML = `
                    <button class="action-btn complete" onclick="orderManagement.updateOrderStatus(this, 'complete')">
                        <i class="fas fa-check-circle"></i>
                        Complete Order
                    </button>
                    <button class="action-btn cancel" onclick="orderManagement.cancelOrder(this)">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                `;
                break;
        }
    }

    renderOrders(orders) {
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) {
            console.error('ordersContainer element not found in the page');
            return;
        }
        ordersContainer.innerHTML = ''; // Clear existing orders

        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p>No orders found.</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.setAttribute('data-order-id', order._id); // Set data attribute before innerHTML

            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += `<div class="item-row">${item.name} x ${item.quantity}</div>`;
            });

            orderCard.innerHTML = `
                <div class="order-header">
                    <div class="order-id">
                        <h3>Order #${order.orderId || 'N/A'}</h3>
                        <span class="status-badge ${order.status}">${order.status}</span>
                    </div>
                </div>
                <div class="customer-info">
                    <div class="info-item"><i class="fas fa-user"></i> ${order.customerName || 'N/A'}</div>
                    <div class="info-item"><i class="fas fa-phone"></i> ${order.customerPhone || 'N/A'}</div>
                    <div class="info-item"><i class="fas fa-map-marker-alt"></i> ${order.address || 'N/A'}</div>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
                <div class="order-total">
                    <span>Total:</span>
                    <span>₱${(order.total || 0).toFixed(2)}</span>
                </div>
                <div class="order-actions">
                    <!-- Buttons will be dynamically updated by updateActionButtons -->
                </div>
            `;
            
            // Re-apply data attribute after innerHTML to ensure it persists
            orderCard.setAttribute('data-order-id', order._id);
            ordersContainer.appendChild(orderCard);
            this.updateActionButtons(orderCard, order.status); // Set initial buttons
        });
    }
}

// Initialize
window.orderManagement = new OrderManagement();