import { stateService } from './services/state.service.js';

// Handle delivery type toggle
function setupDeliveryTypeToggle() {
    const pickupOption = document.getElementById('pickupOption');
    const deliveryOption = document.getElementById('deliveryOption');
    const addressGroup = document.getElementById('addressGroup');
    const addressField = document.getElementById('address');

    function updateDeliveryType() {
        if (deliveryOption.checked) {
            // Show address field and make it required
            addressGroup.style.display = 'block';
            addressField.disabled = false;
            addressField.required = true;
            addressField.focus();
        } else {
            // Hide address field and make it optional
            addressGroup.style.display = 'none';
            addressField.disabled = true;
            addressField.required = false;
            addressField.value = '';
        }
    }

    // Add event listeners to radio buttons
    pickupOption.addEventListener('change', updateDeliveryType);
    deliveryOption.addEventListener('change', updateDeliveryType);
}

function submitCustomerDetails(event) {
    event.preventDefault();

    // Validate phone number
    const phoneNumber = document.getElementById('customerPhone').value;
    const phoneRegex = /^09\d{9}$/;
    
    if (!phoneRegex.test(phoneNumber)) {
        alert('⚠️ Warning!\nPhone number must be 11 digits and start with 09\n(e.g., 09123456789)');
        document.getElementById('customerPhone').focus();
        return;
    }

    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const address = deliveryType === 'delivery' ? document.getElementById('address').value : 'Pick Up';

    const customerDetails = {
        customerName: document.getElementById('fullName').value,
        customerPhone: document.getElementById('customerPhone').value,
        address: address,
        deliveryType: deliveryType,
        email: document.getElementById('email').value,
        specialInstructions: document.getElementById('specialInstructions').value,
    };

    const currentOrder = stateService.currentOrder || {};
    const updatedOrder = { ...currentOrder, ...customerDetails };
    stateService.setCurrentOrder(updatedOrder);

    // Proceed to payment page
    window.location.href = "paymentMethods.html";
}

document.addEventListener('DOMContentLoaded', function() {
    // Auto-populate email from user account
    const emailInput = document.getElementById('email');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    // Setup delivery type toggle
    setupDeliveryTypeToggle();

    // Form submission listener
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', submitCustomerDetails);
    }

    // Back button listener
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'orderedList.html';
        });
    }
});