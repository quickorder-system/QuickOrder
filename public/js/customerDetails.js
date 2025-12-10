// Validation functions
function validateFullName(value) {
    if (!value || value.trim().length === 0) {
        return 'Full name is required';
    }
    if (value.trim().length < 2) {
        return 'Full name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(value)) {
        return 'Full name can only contain letters, spaces, and hyphens';
    }
    return '';
}

function validatePhoneNumber(value) {
    if (!value || value.length === 0) {
        return 'Phone number is required';
    }
    if (!/^09\d{9}$/.test(value)) {
        return 'Phone number must be 11 digits starting with 09 (e.g., 09123456789)';
    }
    return '';
}

function validateEmail(value) {
    if (!value || value.length === 0) {
        return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
    }
    return '';
}

function validateAddress(value) {
    if (!value || value.trim().length === 0) {
        return 'Delivery address is required';
    }
    if (value.trim().length < 10) {
        return 'Please provide a more detailed address';
    }
    return '';
}

function displayError(fieldId, errorMessage) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(fieldId + 'Error');
    
    if (errorMessage) {
        input.classList.add('input-error');
        if (errorSpan) {
            errorSpan.textContent = errorMessage;
            errorSpan.style.display = 'block';
            errorSpan.setAttribute('aria-live', 'polite');
        }
    } else {
        input.classList.remove('input-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
            errorSpan.removeAttribute('aria-live');
        }
    }
}

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

    // Validate all fields
    const fullNameError = validateFullName(document.getElementById('fullName').value);
    const phoneError = validatePhoneNumber(document.getElementById('customerPhone').value);
    const emailError = validateEmail(document.getElementById('email').value);
    
    displayError('fullName', fullNameError);
    displayError('customerPhone', phoneError);
    displayError('email', emailError);

    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    let addressError = '';
    if (deliveryType === 'delivery') {
        addressError = validateAddress(document.getElementById('address').value);
        displayError('address', addressError);
    }

    // If there are any errors, don't submit
    if (fullNameError || phoneError || emailError || addressError) {
        return;
    }

    const address = deliveryType === 'delivery' ? document.getElementById('address').value : 'Pick Up';

    const customerDetails = {
        customerId: stateService.user?.id || localStorage.getItem('userId'),
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

    // Auto-populate address from user profile if delivery is selected
    const addressInput = document.getElementById('address');
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress && addressInput) {
        addressInput.value = savedAddress;
    }

    // Setup delivery type toggle
    setupDeliveryTypeToggle();

    // Setup real-time validation
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('customerPhone');
    const emailInputField = document.getElementById('email');
    // addressInput already declared above for auto-population

    // Full Name validation
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function() {
            const error = validateFullName(this.value);
            displayError('fullName', error);
        });
        fullNameInput.addEventListener('blur', function() {
            const error = validateFullName(this.value);
            displayError('fullName', error);
        });
    }

    // Phone Number validation
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Allow only digits
            this.value = this.value.replace(/[^0-9]/g, '');
            const error = validatePhoneNumber(this.value);
            displayError('customerPhone', error);
        });
        phoneInput.addEventListener('blur', function() {
            const error = validatePhoneNumber(this.value);
            displayError('customerPhone', error);
        });
    }

    // Email validation
    if (emailInputField) {
        emailInputField.addEventListener('input', function() {
            const error = validateEmail(this.value);
            displayError('email', error);
        });
        emailInputField.addEventListener('blur', function() {
            const error = validateEmail(this.value);
            displayError('email', error);
        });
    }

    // Address validation
    if (addressInput) {
        addressInput.addEventListener('input', function() {
            const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
            if (deliveryType === 'delivery') {
                const error = validateAddress(this.value);
                displayError('address', error);
            }
        });
        addressInput.addEventListener('blur', function() {
            const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
            if (deliveryType === 'delivery') {
                const error = validateAddress(this.value);
                displayError('address', error);
            }
        });
    }

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