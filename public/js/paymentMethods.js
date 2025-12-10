const uploadAreaClick = document.getElementById('uploadAreaClick');
const screenshotInput = document.getElementById('paymentScreenshot');
const screenshotPreview = document.getElementById('screenshotPreview');
const orderItemsDiv = document.getElementById('orderItems');
const customerDetailsDiv = document.getElementById('customerDetails');
const totalAmountSpan = document.getElementById('totalAmount');
const paymentForm = document.getElementById('paymentForm');
const submitButton = document.getElementById('submitButton');
const toast = document.getElementById('toast');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const screenshotError = document.getElementById('screenshotError');


function previewScreenshot() {
    const file = screenshotInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            screenshotPreview.src = e.target.result;
            screenshotPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        screenshotPreview.src = '';
        screenshotPreview.style.display = 'none';
    }
}

function displayOrderReview() {
    const cart = stateService.cart;
    const currentOrder = stateService.currentOrder;

    if (!cart || cart.length === 0) {
        orderItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        totalAmountSpan.textContent = '₱0';
        return;
    }

    orderItemsDiv.innerHTML = cart.map(item => `
        <div class="order-item">
            <div class="order-item-header">
                <span class="order-item-name">${item.name} x ${item.quantity}</span>
                <span class="order-item-price">₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            ${item.selectedVariations && item.selectedVariations.length > 0 ? `
                <div class="order-item-variations">
                    ${item.selectedVariations.map(v => `
                        <div class="variation-detail">
                            <span class="variation-name">${v.variationName}:</span>
                            <span class="variation-value">${v.selectedOption}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Calculate totals with discount
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    const appliedDiscount = stateService.appliedDiscount;
    
    if (appliedDiscount) {
        if (appliedDiscount.discountType === 'percentage') {
            discountAmount = (subtotal * appliedDiscount.discountValue) / 100;
        } else if (appliedDiscount.discountType === 'fixed') {
            discountAmount = appliedDiscount.discountValue;
        }
        
        // Apply max discount cap if set
        if (appliedDiscount.maxDiscountAmount && discountAmount > appliedDiscount.maxDiscountAmount) {
            discountAmount = appliedDiscount.maxDiscountAmount;
        }
    }
    
    let total = subtotal - discountAmount;
    
    // Display total with discount breakdown if applicable
    if (appliedDiscount) {
        totalAmountSpan.innerHTML = `
            <div class="price-breakdown">
                <div class="price-line">
                    <span>Subtotal</span>
                    <span>₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="price-line discount">
                    <span>Discount (${appliedDiscount.code})</span>
                    <span>-₱${discountAmount.toFixed(2)}</span>
                </div>
                <div class="price-line total">
                    <span>TOTAL</span>
                    <span>₱${total.toFixed(2)}</span>
                </div>
            </div>
        `;
    } else {
        totalAmountSpan.textContent = `₱${total.toFixed(2)}`;
    }

    if (currentOrder) {
        customerDetailsDiv.innerHTML = `
            <p><strong>Name:</strong> ${currentOrder.customerName}</p>
            <p><strong>Phone:</strong> ${currentOrder.customerPhone}</p>
            <p><strong>Address:</strong> ${currentOrder.address}</p>
            <p><strong>Email:</strong> ${currentOrder.email}</p>
            <p><strong>Instructions:</strong> ${currentOrder.specialInstructions || 'N/A'}</p>
        `;
    } else {
        customerDetailsDiv.innerHTML = '<p>No customer details available.</p>';
    }
}

function selectPayment(selectedOption) {
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('input[type="radio"]').checked = false;
    });
    selectedOption.classList.add('selected');
    selectedOption.querySelector('input[type="radio"]').checked = true;
}

async function handleOrderSubmit(event) {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    const paymentMethod = document.querySelector('input[name="payMethod"]:checked').value;
    const screenshotFile = screenshotInput.files[0];

    // For Cash payment, no screenshot is required
    if (paymentMethod !== 'Cash' && !screenshotFile) {
        screenshotError.textContent = 'Please upload a payment screenshot.';
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm & Place Order →';
        return;
    }

    screenshotError.textContent = ''; // Clear any previous error

    try {
        let uploadResponse = { fileUrl: null };

        // Only upload screenshot for online payment methods
        if (paymentMethod !== 'Cash' && screenshotFile) {
            // Simulate upload progress
            progressBar.style.width = '0%';
            progressText.textContent = 'Uploading... 0%';
            const uploadProgress = setInterval(() => {
                let width = parseInt(progressBar.style.width);
                if (width < 90) {
                    width += 10;
                    progressBar.style.width = `${width}%`;
                    progressText.textContent = `Uploading... ${width}%`;
                } else {
                    clearInterval(uploadProgress);
                }
            }, 200);

            uploadResponse = await ApiService.uploadImage(screenshotFile);
            clearInterval(uploadProgress); // Ensure interval is cleared on successful upload

            if (!uploadResponse || !uploadResponse.fileUrl) {
                throw new Error('Failed to upload screenshot.');
            }

            progressBar.style.width = '100%';
            progressText.textContent = 'Upload Complete!';
        } else if (paymentMethod === 'Cash') {
            progressBar.style.width = '100%';
            progressText.textContent = 'Ready to proceed!';
        }

        const subtotal = stateService.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const appliedDiscount = stateService.appliedDiscount;
        const discountAmount = appliedDiscount?.discountAmount || 0;
        const total = subtotal - discountAmount;

        const orderData = {
            ...stateService.currentOrder,
            items: stateService.cart.map(item => ({
                itemId: item.id, // Map 'id' to 'itemId'
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            subtotal: subtotal,
            total: total,
            paymentMethod: paymentMethod,
            paymentScreenshot: uploadResponse.fileUrl || 'N/A (Cash Payment)',
            status: 'pending',
            // Include discount information
            ...(appliedDiscount && {
                discount: {
                    discountId: appliedDiscount.id,
                    code: appliedDiscount.code,
                    discountType: appliedDiscount.discountType,
                    discountValue: appliedDiscount.discountValue,
                    discountAmount: discountAmount
                }
            })
        };

        const newOrder = await ApiService.createOrder(orderData);
        stateService.clearCart();
        stateService.setCurrentOrder(null);
        stateService.clearAppliedDiscount();
        showToast('Order placed successfully!', 'success');
        setTimeout(() => {
            window.location.href = `/receipt.html?orderId=${newOrder.orderId}`;
        }, 2000);

    } catch (error) {
        console.error('Failed to submit order:', error);
        showToast(`Error placing order: ${error.message}`, 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm & Place Order →';
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading... 0%';
    }
}

function showToast(message, type) {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Toggle payment instruction based on selected payment method
 */
function togglePaymentInstructions() {
    const gcashRadio = document.getElementById('gcash');
    const mayaRadio = document.getElementById('maya');
    const cashRadio = document.getElementById('cash');
    const gcashInstructions = document.getElementById('gcashInstructions');
    const mayaInstructions = document.getElementById('mayaInstructions');
    const cashInstructions = document.getElementById('cashInstructions');
    const uploadSection = document.getElementById('uploadSection');

    if (!gcashInstructions || !mayaInstructions || !cashInstructions) return;

    if (gcashRadio && gcashRadio.checked) {
        gcashInstructions.style.display = 'block';
        mayaInstructions.style.display = 'none';
        cashInstructions.style.display = 'none';
        uploadSection.style.display = 'block';
    } else if (mayaRadio && mayaRadio.checked) {
        gcashInstructions.style.display = 'none';
        mayaInstructions.style.display = 'block';
        cashInstructions.style.display = 'none';
        uploadSection.style.display = 'block';
    } else if (cashRadio && cashRadio.checked) {
        gcashInstructions.style.display = 'none';
        mayaInstructions.style.display = 'none';
        cashInstructions.style.display = 'block';
        uploadSection.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ApiService.checkApiHealth();
    displayOrderReview();
    paymentForm.addEventListener('submit', handleOrderSubmit);

    // Add event listeners for payment options
    document.querySelectorAll('.payment-option-clickable').forEach(option => {
        option.addEventListener('click', () => selectPayment(option));
    });

    // Add event listeners for payment method radio buttons to toggle instructions
    const gcashRadio = document.getElementById('gcash');
    const mayaRadio = document.getElementById('maya');
    const cashRadio = document.getElementById('cash');
    if (gcashRadio) {
        gcashRadio.addEventListener('change', togglePaymentInstructions);
    }
    if (mayaRadio) {
        mayaRadio.addEventListener('change', togglePaymentInstructions);
    }
    if (cashRadio) {
        cashRadio.addEventListener('change', togglePaymentInstructions);
    }

    screenshotInput.addEventListener('change', previewScreenshot);

    // Drag and drop functionality
    uploadAreaClick.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadAreaClick.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        uploadAreaClick.style.borderColor = '#667eea';
    });

    uploadAreaClick.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadAreaClick.style.backgroundColor = '';
        uploadAreaClick.style.borderColor = '';
    });

    uploadAreaClick.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadAreaClick.style.backgroundColor = '';
        uploadAreaClick.style.borderColor = '';
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            screenshotInput.files = files;
            previewScreenshot();
        }
    });

    // Back button listener
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'customerDetails.html';
        });
    }
});
