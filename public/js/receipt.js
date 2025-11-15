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
        
        // Display formatted order ID
        const orderNumberElem = document.getElementById('orderNumber');
        if (orderNumberElem) {
            orderNumberElem.textContent = '#' + order.orderId;
        }

        // Update status based on order data
        const statusElem = document.querySelector('.info-item strong');
        if (statusElem && order.status) {
            statusElem.nextSibling.textContent = ` ${order.status}`;
        }

    } catch (error) {
        console.error('Error fetching order details:', error);
    }
}

// Call the function when the page loads
fetchOrderDetails();

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
