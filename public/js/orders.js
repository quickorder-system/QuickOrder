document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    // Set up auto-refresh to fetch latest orders every 5 seconds
    setInterval(refreshOrdersList, 5000);

    // Delegated event listener for status changes
    const ordersContainer = document.getElementById('ordersContainer');
    if (ordersContainer) {
        ordersContainer.addEventListener('change', async (event) => {
            if (event.target.classList.contains('status-select')) {
                const select = event.target;
                const newStatus = select.value;
                const card = select.closest('.order-card');
                const orderId = card.dataset.orderId;
                const oldStatus = select.dataset.previousStatus || Array.from(select.options).find(o => o.selected)?.value;

                // Disable select while updating
                select.disabled = true;
                select.style.opacity = '0.6';

                try {
                    console.log(`[Orders] Updating order ${orderId} status from ${oldStatus} to ${newStatus}`);
                    const updatedOrder = await OrderService.updateOrderStatus(orderId, newStatus);
                    
                    console.log(`[Orders] Status updated successfully:`, updatedOrder);

                    // Update the status badge immediately
                    const statusBadge = card.querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.className = `status-badge ${updatedOrder.status}`;
                        statusBadge.textContent = updatedOrder.status.charAt(0).toUpperCase() + updatedOrder.status.slice(1);
                    }

                    // Update select styling
                    select.className = 'status-select';
                    select.classList.add(`status-${updatedOrder.status}`);

                    // Store the new status to track it
                    select.dataset.previousStatus = updatedOrder.status;

                    // If order is completed or cancelled, remove it from the view after a delay
                    if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
                        setTimeout(() => {
                            card.style.opacity = '0';
                            setTimeout(() => {
                                card.remove();
                                // Refresh the list after removing
                                refreshOrdersList();
                            }, 500);
                        }, 1000);
                    } else {
                        // Re-enable select after successful update
                        select.disabled = false;
                        select.style.opacity = '1';
                    }
                } catch (error) {
                    console.error(`[Orders] Error updating status:`, error);
                    alert(`Failed to update order status: ${error.message}`);
                    // Revert the select to its previous value on failure
                    select.value = oldStatus;
                    // Re-enable select
                    select.disabled = false;
                    select.style.opacity = '1';
                }
            }
        });
    }
});

async function loadOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = '<p>Loading orders...</p>';
    try {
        const orders = await OrderService.getAllOrders();
        renderOrders(orders);
    } catch (error) {
        ordersContainer.innerHTML = '<p class="error">Failed to load orders. Please try again later.</p>';
        console.error('Error loading orders:', error);
    }
}

async function refreshOrdersList() {
    try {
        const orders = await OrderService.getAllOrders();
        const ordersContainer = document.getElementById('ordersContainer');
        
        if (!ordersContainer) return;

        // Get currently active order IDs in the DOM
        const currentOrderIds = new Set(
            Array.from(ordersContainer.querySelectorAll('.order-card')).map(card => card.dataset.orderId)
        );

        // Get new order IDs from the server
        const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
        const newOrderIds = new Set(activeOrders.map(order => order._id));

        // Update existing order cards or create new ones
        activeOrders.forEach(order => {
            const existingCard = ordersContainer.querySelector(`[data-order-id="${order._id}"]`);
            if (existingCard) {
                // Check if status has changed
                const currentStatusBadge = existingCard.querySelector('.status-badge');
                if (currentStatusBadge && currentStatusBadge.textContent.toLowerCase() !== order.status) {
                    // Recreate the card if status has changed
                    const newCard = createOrderCard(order);
                    existingCard.replaceWith(newCard);
                }
            } else {
                // Add new order card
                const orderCard = createOrderCard(order);
                ordersContainer.appendChild(orderCard);
            }
        });

        // Remove orders that are no longer in the active list
        Array.from(ordersContainer.querySelectorAll('.order-card')).forEach(card => {
            if (!newOrderIds.has(card.dataset.orderId)) {
                card.remove();
            }
        });

        // Show "no orders" message if empty
        if (activeOrders.length === 0 && ordersContainer.children.length === 0) {
            ordersContainer.innerHTML = '<p>No active orders.</p>';
        }
    } catch (error) {
        console.error('Error refreshing orders:', error);
    }
}

function renderOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = '';
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p>No active orders.</p>';
        return;
    }
    // Filter out completed or cancelled orders from the initial render
    const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
    activeOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersContainer.appendChild(orderCard);
    });
}