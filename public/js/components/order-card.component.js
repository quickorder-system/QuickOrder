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

    // Get delivery type - if not set, infer from address
    // For backward compatibility: if no deliveryType is set, it's an old order
    // Old orders without explicit deliveryType should be treated as delivery (they have addresses)
    let deliveryType = order.deliveryType;
    if (!deliveryType) {
        // For old orders without deliveryType field, check the address
        // If address is exactly "Pick Up", it's pickup; otherwise delivery
        deliveryType = (order.address && order.address.trim().toLowerCase() === 'pick up') ? 'pickup' : 'delivery';
    }
    
    const deliveryIcon = deliveryType === 'pickup' ? 'fas fa-store' : 'fas fa-truck';
    const deliveryLabel = deliveryType === 'pickup' ? 'Pick Up' : 'Delivery';
    
    // Show address details only for delivery orders
    const deliveryAddressHtml = deliveryType === 'delivery' && order.address && order.address.trim().toLowerCase() !== 'pick up'
        ? `<div class="delivery-address-info">
            <i class="fas fa-location-dot"></i>
            <span class="address-text">${order.address}</span>
        </div>`
        : '';

    // Determine payment status display
    const paymentStatus = order.paymentStatus || 'pending';
    const paymentMethod = order.paymentMethod || 'Unknown';
    const paymentStatusClass = `payment-${paymentStatus}`;
    const paymentStatusText = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
    
    // Payment status icons
    let paymentStatusIcon = 'fas fa-clock';
    if (paymentStatus === 'verified') {
        paymentStatusIcon = 'fas fa-check-circle';
    } else if (paymentStatus === 'rejected') {
        paymentStatusIcon = 'fas fa-times-circle';
    }

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
            <div class="info-item"><i class="fas fa-envelope"></i> <span>${order.email || 'N/A'}</span></div>
            <div class="info-item delivery-type-badge ${deliveryType}"><i class="${deliveryIcon}"></i> <span>${deliveryLabel}</span></div>
            ${deliveryAddressHtml}
        </div>
        <div class="order-items">${itemsHtml}</div>
        ${specialInstructionsHtml}
        <div class="order-total">
            <span>Total:</span>
            <span>₱${order.total.toFixed(2)}</span>
        </div>
        <div class="payment-info-section">
            <div class="payment-method">
                <i class="fas fa-credit-card"></i>
                <span class="payment-method-name">${paymentMethod}</span>
            </div>
            <div class="payment-status ${paymentStatusClass}">
                <i class="${paymentStatusIcon}"></i>
                <span>${paymentStatusText}</span>
            </div>
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

    // Update status class based on current selection
    updateStatusSelectClass(statusSelect, status);

    // Add change event listener for status updates
    statusSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        const oldStatus = status;
        
        let hasError = false;
        try {
            // Show loading state
            statusSelect.disabled = true;
            statusSelect.style.opacity = '0.6';
            
            console.log(`[OrderCard] Updating status from ${oldStatus} to ${newStatus}`);
            
            // Call API to update status using OrderService with proper auth
            const updatedOrder = await OrderService.updateOrderStatus(order._id, newStatus);
            
            console.log(`[OrderCard] Status updated successfully:`, updatedOrder);

            // Update the order card with new status
            const orderCard = statusSelect.closest('.order-card');
            if (orderCard) {
                const statusBadge = orderCard.querySelector('.status-badge');
                if (statusBadge) {
                    // Remove old status classes
                    statusBadge.classList.remove('pending', 'preparing', 'ready', 'complete', 'cancelled');
                    // Add new status class
                    statusBadge.classList.add(newStatus);
                    // Update text
                    statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                }
            }
            
            // Update select styling
            updateStatusSelectClass(statusSelect, newStatus);
            
            // Show success feedback
            showStatusUpdateFeedback(statusSelect, true, oldStatus, newStatus);
        } catch (error) {
            hasError = true;
            console.error('[OrderCard] Error updating status:', error);
            // Revert on error
            statusSelect.value = oldStatus;
            showStatusUpdateFeedback(statusSelect, false);
        } finally {
            // Ensure the select is always re-enabled
            setTimeout(() => {
                statusSelect.disabled = false;
                statusSelect.style.opacity = '1';
                console.log(`[OrderCard] Select re-enabled. Error occurred: ${hasError}`);
            }, 100);
        }
    });

    container.appendChild(statusSelect);

    // Add 'View Payment' button if a screenshot exists
    if (paymentScreenshot || order.paymentMethod) {
        const paymentButton = document.createElement('button');
        paymentButton.className = 'action-btn view-payment';
        paymentButton.innerHTML = '<i class="fas fa-receipt"></i> View Payment';
        paymentButton.onclick = () => openEnhancedPaymentModal(order);
        container.appendChild(paymentButton);
    }
}

// Helper function to update status select styling based on current status
function updateStatusSelectClass(selectElement, status) {
    selectElement.className = 'status-select';
    selectElement.classList.add(`status-${status}`);
}

// Helper function to show visual feedback when status is updated
function showStatusUpdateFeedback(selectElement, success, oldStatus, newStatus) {
    const orderCard = selectElement.closest('.order-card');
    if (!orderCard) return;

    if (success) {
        // Add success animation
        orderCard.style.animation = 'none';
        setTimeout(() => {
            orderCard.style.animation = 'statusUpdateSuccess 0.6s ease-out';
        }, 10);

        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = 'status-update-toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Status updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong></span>
        `;
        orderCard.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } else {
        // Show error feedback
        const toast = document.createElement('div');
        toast.className = 'status-update-toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to update status. Please try again.</span>
        `;
        orderCard.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Enhanced payment modal with detailed payment information
function openEnhancedPaymentModal(order) {
    // Remove any existing modal
    const existingModal = document.getElementById('payment-details-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create new modal with proper structure
    const modal = document.createElement('div');
    modal.id = 'payment-details-modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
    `;
    document.body.appendChild(modal);

    const paymentStatus = order.paymentStatus || 'pending';
    const paymentMethod = order.paymentMethod || 'Unknown';
    const paymentStatusClass = `payment-${paymentStatus}`;
    
    let paymentStatusIcon = 'fas fa-clock';
    let paymentStatusText = 'Pending Verification';
    let paymentStatusColor = '#f39c12';
    
    if (paymentStatus === 'verified') {
        paymentStatusIcon = 'fas fa-check-circle';
        paymentStatusText = 'Verified';
        paymentStatusColor = '#27ae60';
    } else if (paymentStatus === 'rejected') {
        paymentStatusIcon = 'fas fa-times-circle';
        paymentStatusText = 'Rejected';
        paymentStatusColor = '#e74c3c';
    }

    // Format the date
    const paymentDate = new Date(order.createdAt).toLocaleString();

    // Build payment method logo
    const paymentMethodLogo = paymentMethod.toLowerCase() === 'gcash' 
        ? '<i class="fas fa-mobile"></i> GCash'
        : paymentMethod.toLowerCase() === 'maya'
        ? '<i class="fas fa-credit-card"></i> Maya'
        : `<i class="fas fa-wallet"></i> ${paymentMethod}`;

    // Check if user is admin/owner (has auth token)
    const isAdminOrOwner = !!localStorage.getItem('token');
    
    const verifyRejectUI = isAdminOrOwner ? `
        <div class="payment-verification-section">
            <h3>Payment Verification</h3>
            <div class="verification-buttons">
                <button class="verify-btn" onclick="updatePaymentStatus('${order._id}', 'verified')">
                    <i class="fas fa-check-circle"></i> Verify Payment
                </button>
                <button class="reject-btn" onclick="updatePaymentStatus('${order._id}', 'rejected')">
                    <i class="fas fa-times-circle"></i> Reject Payment
                </button>
            </div>
        </div>
    ` : '';

    modal.innerHTML = `
        <div class="modal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;"></div>
        <div class="payment-modal-content">
            <div class="payment-modal-header">
                <h2>Payment Details</h2>
                <button class="close-modal-btn" type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #636e72; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease;" title="Close payment details">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="payment-modal-body">
                <!-- Payment Status -->
                <div class="payment-status-card ${paymentStatusClass}">
                    <i class="${paymentStatusIcon}"></i>
                    <div class="status-text">
                        <div class="status-label">Payment Status</div>
                        <div class="status-value">${paymentStatusText}</div>
                    </div>
                </div>

                <!-- Order & Payment Info -->
                <div class="payment-info-grid">
                    <div class="info-box">
                        <div class="info-label">Order ID</div>
                        <div class="info-value">#${order.orderId}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Order Date</div>
                        <div class="info-value">${paymentDate}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Payment Method</div>
                        <div class="info-value payment-method-display">${paymentMethodLogo}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">Order Amount</div>
                        <div class="info-value amount">₱${order.total.toFixed(2)}</div>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="customer-details">
                    <h3>Customer Information</h3>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-user"></i> Name:</span>
                        <span class="detail-value">${order.customerName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-phone"></i> Phone:</span>
                        <span class="detail-value">${order.customerPhone}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-envelope"></i> Email:</span>
                        <span class="detail-value">${order.email || 'N/A'}</span>
                    </div>
                </div>

                <!-- Order Items -->
                <div class="order-items-details">
                    <h3>Order Items</h3>
                    <div class="items-table">
                        ${order.items.map(item => `
                            <div class="item-row">
                                <span class="item-name">${item.name}</span>
                                <span class="item-qty">x${item.quantity}</span>
                                <span class="item-price">₱${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="items-total">
                        <span>Total:</span>
                        <span>₱${order.total.toFixed(2)}</span>
                    </div>
                </div>

                <!-- Payment Screenshot -->
                ${order.paymentScreenshot ? `
                    <div class="payment-screenshot-section">
                        <h3>Payment Proof</h3>
                        <div class="screenshot-container">
                            <img src="${order.paymentScreenshot.startsWith('http') ? order.paymentScreenshot : window.location.origin + order.paymentScreenshot}" alt="Payment Screenshot" id="payment-screenshot" style="cursor: pointer; transition: transform 0.2s ease; border-radius: 8px;" title="Click to view full size">
                        </div>
                    </div>
                ` : '<div class="no-screenshot">No payment screenshot uploaded</div>'}

                <!-- Payment Verification UI (Admin/Owner only) -->
                ${verifyRejectUI}
            </div>
        </div>
    `;

    // Set up close button
    const closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePaymentModalDirect(modal);
            return false;
        };
    }

    // Set up overlay close
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
                closePaymentModalDirect(modal);
                return false;
            }
        };
    }

    // Set up escape key
    window.paymentModalEscapeHandler = function(e) {
        if (e.key === 'Escape') {
            closePaymentModalDirect(modal);
        }
    };
    document.addEventListener('keydown', window.paymentModalEscapeHandler);

    // Set up image viewer for payment screenshot
    const screenshotImg = modal.querySelector('#payment-screenshot');
    if (screenshotImg) {
        screenshotImg.addEventListener('click', function(e) {
            e.stopPropagation();
            openImageViewer(order.paymentScreenshot, 'Payment Screenshot');
        });
        screenshotImg.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.02)';
        });
        screenshotImg.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    }
}

// Close payment modal function - Direct version that uses modal reference
function closePaymentModalDirect(modal) {
    if (modal) {
        // Set display to none immediately to hide it
        modal.style.pointerEvents = 'none';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease-out';
        
        // Then remove after animation completes
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.style.display = 'none';
            }
            // Remove escape listener
            if (window.paymentModalEscapeHandler) {
                document.removeEventListener('keydown', window.paymentModalEscapeHandler);
                delete window.paymentModalEscapeHandler;
            }
        }, 350);
    }
}

// Close payment modal function - Backup version (in case ID lookup is needed)
function closePaymentModal() {
    const modal = document.getElementById('payment-details-modal');
    closePaymentModalDirect(modal);
}

// Update payment status via API
async function updatePaymentStatus(orderId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Unauthorized: Please login');
            return;
        }

        const response = await fetch(`/api/orders/${orderId}/payment-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ paymentStatus: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update payment status');
        }

        const updatedOrder = await response.json();
        
        // Update the UI
        const modal = document.getElementById('payment-details-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Reload orders to reflect changes
        location.reload();
    } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Error: ' + error.message);
    }
}

// Image viewer function - Opens full screen image view
function openImageViewer(imageSrc, title = 'Image') {
    // Remove any existing viewer
    const existingViewer = document.getElementById('image-viewer-modal');
    if (existingViewer) {
        existingViewer.remove();
    }

    // Create image viewer modal
    const viewer = document.createElement('div');
    viewer.id = 'image-viewer-modal';
    viewer.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    `;
    document.body.appendChild(viewer);

    viewer.innerHTML = `
        <div class="image-viewer-header" style="position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 20px; color: white; z-index: 10002;">
            <h2 style="margin: 0; font-size: 1.5rem;">${title}</h2>
            <button class="close-viewer-btn" type="button" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease;" title="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="image-viewer-container" style="display: flex; align-items: center; justify-content: center; flex: 1; width: 100%; max-width: 90vw; max-height: 85vh; overflow: auto;">
            <img src="${imageSrc}" alt="${title}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
        </div>
        <div class="image-viewer-footer" style="position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; color: #999; font-size: 0.9rem;">
            <p style="margin: 0;">Click outside or press ESC to close</p>
        </div>
    `;

    // Close button handler
    const closeBtn = viewer.querySelector('.close-viewer-btn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closeImageViewer(viewer);
        };
    }

    // Click outside to close
    viewer.onclick = function(e) {
        if (e.target === viewer) {
            closeImageViewer(viewer);
        }
    };

    // Escape key to close
    window.imageViewerEscapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeImageViewer(viewer);
        }
    };
    document.addEventListener('keydown', window.imageViewerEscapeHandler);
}

// Close image viewer function
function closeImageViewer(viewer) {
    if (viewer) {
        viewer.style.opacity = '0';
        viewer.style.transition = 'opacity 0.2s ease-out';
        
        setTimeout(() => {
            if (viewer && viewer.parentNode) {
                viewer.remove();
            }
            // Remove escape listener
            if (window.imageViewerEscapeHandler) {
                document.removeEventListener('keydown', window.imageViewerEscapeHandler);
                delete window.imageViewerEscapeHandler;
            }
        }, 200);
    }
}
