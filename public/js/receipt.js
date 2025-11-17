// Function to fetch order details from the database
async function fetchOrderDetails() {
    try {
        // Get the order ID from the URL query string
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');

        if (!orderId) {
            console.error('No order ID found in URL');
            // Optionally hide the order number element or show an error
            const orderNumberElem = document.getElementById('orderNumber');
            if(orderNumberElem) orderNumberElem.textContent = 'Order Not Found';
            return;
        }

        // Fetch order details from the server
        const response = await fetch(`http://localhost:5001/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        console.log('Order details fetched:', order);
        
        // Display formatted order ID
        const orderNumberElem = document.getElementById('orderNumber');
        if (orderNumberElem) {
            orderNumberElem.textContent = '#' + order.orderId;
        }

        // Update order status
        const orderStatusElem = document.getElementById('orderStatus');
        if (orderStatusElem && order.status) {
            orderStatusElem.textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        }

        // Update payment status
        updatePaymentStatusDisplay(order);

    } catch (error) {
        console.error('Error fetching order details:', error);
    }
}

// Helper function to update payment status display
function updatePaymentStatusDisplay(order) {
    const paymentStatusElem = document.getElementById('paymentStatus');
    const paymentInfoElem = document.getElementById('paymentInfo');
    const debugPaymentStatus = document.getElementById('debugPaymentStatus');
    
    if (paymentStatusElem && paymentInfoElem) {
        let paymentStatusText = 'Pending Verification';
        let paymentStatusClass = 'payment-pending';
        
        // Use paymentStatus from order, default to 'pending' if not set
        const currentPaymentStatus = order.paymentStatus || 'pending';
        console.log('Current paymentStatus from order:', order.paymentStatus, 'Resolved to:', currentPaymentStatus);
        
        // Update debug info
        if (debugPaymentStatus) {
            debugPaymentStatus.textContent = `paymentStatus="${order.paymentStatus || 'undefined'}" → "${currentPaymentStatus}"`;
        }
        
        if (currentPaymentStatus === 'verified') {
            paymentStatusText = 'Verified ✓';
            paymentStatusClass = 'payment-verified';
        } else if (currentPaymentStatus === 'rejected') {
            paymentStatusText = 'Rejected ✗';
            paymentStatusClass = 'payment-rejected';
        }
        
        paymentStatusElem.textContent = paymentStatusText;
        
        // Update the class for styling
        paymentInfoElem.className = `info-item ${paymentStatusClass}`;
        
        console.log('Payment status updated to:', paymentStatusText);
    }
}

// Function to refresh payment status without full page reload
async function refreshPaymentStatus(orderId) {
    try {
        const response = await fetch(`http://localhost:5001/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        console.log('Refreshed order data:', order);
        console.log('Full order object:', JSON.stringify(order, null, 2));
        
        // Update order status
        if (order.status) {
            const orderStatusElem = document.getElementById('orderStatus');
            const newStatusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
            if (orderStatusElem && orderStatusElem.textContent !== newStatusText) {
                orderStatusElem.textContent = newStatusText;
                console.log('Order status refreshed to:', newStatusText);
            }
        }
        
        // Update payment status if it has changed
        const paymentStatusElem = document.getElementById('paymentStatus');
        const paymentInfoElem = document.getElementById('paymentInfo');
        
        if (paymentStatusElem && paymentInfoElem) {
            let paymentStatusText = 'Pending Verification';
            let paymentStatusClass = 'payment-pending';
            
            // Use paymentStatus from order, default to 'pending' if not set
            const currentPaymentStatus = order.paymentStatus || 'pending';
            console.log('Refresh - Current paymentStatus:', order.paymentStatus, 'Resolved to:', currentPaymentStatus);
            
            if (currentPaymentStatus === 'verified') {
                paymentStatusText = 'Verified ✓';
                paymentStatusClass = 'payment-verified';
            } else if (currentPaymentStatus === 'rejected') {
                paymentStatusText = 'Rejected ✗';
                paymentStatusClass = 'payment-rejected';
            }
            
            // Update if status has changed
            if (paymentStatusElem.textContent !== paymentStatusText) {
                console.log('Payment status changed from', paymentStatusElem.textContent, 'to', paymentStatusText);
                paymentStatusElem.textContent = paymentStatusText;
                paymentInfoElem.className = `info-item ${paymentStatusClass}`;
                
                // Add visual indicator that it was updated
                paymentInfoElem.style.animation = 'none';
                setTimeout(() => {
                    paymentInfoElem.style.animation = 'pulse 0.5s ease-out';
                }, 10);
            }
            
            // Stop polling once payment status is verified or rejected
            if (currentPaymentStatus === 'verified' || currentPaymentStatus === 'rejected') {
                console.log('Payment status is final, stopping auto-refresh');
                stopAutoRefresh();
            }
        }
    } catch (error) {
        console.error('Error refreshing payment status:', error);
    }
}

// Call the function when the page loads
fetchOrderDetails();

// Also set up more aggressive polling - check immediately and then every 1 second
let refreshInterval = null;
const MAX_REFRESH_TIME = 5 * 60 * 1000; // Stop polling after 5 minutes
let refreshStartTime = null;

function startAutoRefresh(orderId) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshStartTime = Date.now();
    refreshInterval = setInterval(() => {
        const elapsedTime = Date.now() - refreshStartTime;
        
        // Stop polling after 5 minutes
        if (elapsedTime > MAX_REFRESH_TIME) {
            console.log('Auto-refresh stopped after 5 minutes');
            clearInterval(refreshInterval);
            refreshInterval = null;
            return;
        }
        
        refreshPaymentStatus(orderId);
    }, 1000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('Auto-refresh stopped');
    }
}

// Extract orderId from URL for later use
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');
if (orderId) {
    startAutoRefresh(orderId);
}

setTimeout(() => {
    createConfetti();
}, 500);

function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            document.body.appendChild(confetti);

            const duration = Math.random() * 3 + 2;
            const angle = Math.random() * 360;

            confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight}px) rotate(${angle}deg)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            setTimeout(() => { confetti.remove(); }, duration * 1000);
        }, i * 30);
    }
}
