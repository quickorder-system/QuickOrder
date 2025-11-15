document.addEventListener('DOMContentLoaded', () => {
    loadOrders();

    // Delegated event listener for status changes
    const ordersContainer = document.getElementById('ordersContainer');
    if (ordersContainer) {
        ordersContainer.addEventListener('change', async (event) => {
            if (event.target.classList.contains('status-select')) {
                const select = event.target;
                const newStatus = select.value;
                const card = select.closest('.order-card');
                const orderId = card.dataset.orderId;

                try {
                    const updatedOrder = await OrderService.updateOrderStatus(orderId, newStatus);
                    
                    // Update status badge
                    const statusBadge = card.querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.className = `status-badge ${updatedOrder.status}`;
                        statusBadge.textContent = updatedOrder.status.charAt(0).toUpperCase() + updatedOrder.status.slice(1);
                    }

                    // If order is completed or cancelled, remove it from the view after a delay
                    if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
                        setTimeout(() => {
                            card.style.opacity = '0';
                            setTimeout(() => card.remove(), 500);
                        }, 1000);
                    }
                } catch (error) {
                    alert(`Failed to update order status: ${error.message}`);
                    // Optional: Revert the select to its original value on failure
                    // Note: This requires storing the original status, e.g., in a data attribute.
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