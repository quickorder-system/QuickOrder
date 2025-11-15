function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.orderId = order._id;

    const itemsHtml = order.items.map(item => `
        <div class="item-row">
            <span>${item.name} x ${item.quantity}</span>
            <span>₱${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    const specialInstructionsHtml = order.specialInstructions
        ? `
        <div class="special-instructions">
            <strong>Instructions:</strong>
            <p>${order.specialInstructions}</p>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">
                <h3>#${order.orderId}</h3>
                <span class="status-badge ${order.status}">${order.status}</span>
            </div>
            <div class="order-time">
                <i class="far fa-clock"></i>
                ${new Date(order.createdAt).toLocaleString()}
            </div>
        </div>
        <div class="customer-info">
            <div class="info-item"><i class="fas fa-user"></i> <span>${order.customerName}</span></div>
            <div class="info-item"><i class="fas fa-phone"></i> <span>${order.customerPhone}</span></div>
            <div class="info-item"><i class="fas fa-map-marker-alt"></i> <span>${order.address}</span></div>
        </div>
        <div class="order-items">${itemsHtml}</div>
        ${specialInstructionsHtml}
        <div class="order-total">
            <span>Total:</span>
            <span>₱${order.total.toFixed(2)}</span>
        </div>
        <div class="order-actions">
            <!-- Action buttons will be added here based on order status -->
        </div>
    `;
    
    const actionsContainer = card.querySelector('.order-actions');
    addOrderActions(actionsContainer, order);

    return card;
}

function addOrderActions(container, order) {
    container.innerHTML = ''; // Clear existing content

    const { status, paymentScreenshot } = order;

    // Define the possible statuses (must match backend Order model)
    const statuses = ['Pending', 'Preparing', 'Ready', 'Complete', 'Cancelled'];

    // Create a select element for status
    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';
    statusSelect.dataset.orderId = order._id;

    // Create and append option elements
    statuses.forEach(s => {
        const option = document.createElement('option');
        option.value = s.toLowerCase();
        option.textContent = s;
        if (s.toLowerCase() === status) {
            option.selected = true;
        }
        statusSelect.appendChild(option);
    });

    container.appendChild(statusSelect);

    // Add 'View Payment' button if a screenshot exists
    if (paymentScreenshot) {
        const paymentButton = document.createElement('button');
        paymentButton.className = 'action-btn view-payment';
        paymentButton.innerHTML = '<i class="fas fa-receipt"></i> View Payment';
        paymentButton.onclick = () => openPaymentModal(paymentScreenshot);
        container.appendChild(paymentButton);
    }
}
