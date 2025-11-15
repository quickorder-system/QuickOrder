import { stateService } from './services/state.service.js';

function submitCustomerDetails(event) {
    event.preventDefault();

    const customerDetails = {
        customerName: document.getElementById('fullName').value,
        customerPhone: document.getElementById('customerPhone').value,
        address: document.getElementById('address').value,
        email: document.getElementById('email').value,
        specialInstructions: document.getElementById('specialInstructions').value,
    };

    const currentOrder = stateService.currentOrder || {};
    const updatedOrder = { ...currentOrder, ...customerDetails };
    stateService.setCurrentOrder(updatedOrder);


    // Proceed to payment page
    window.location.href = "paymentMethods.html";
}

document.querySelector('form').addEventListener('submit', submitCustomerDetails);

// Back button listener
document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'orderedList.html';
        });
    }
});