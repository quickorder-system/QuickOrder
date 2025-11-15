import { stateService } from './services/state.service.js';

(() => {
    // Category filter function (dynamic categories)
    function filterCategory() {
        const categorySelect = document.getElementById('categorySelect');
        const selected = categorySelect.value;
        const categories = Array.from(categorySelect.options)
            .map(option => option.value)
            .filter(value => value !== 'all');
        categories.forEach(function(cat) {
            var head = document.getElementById(cat + 'head');
            var section = document.getElementById(cat === 'pizza' ? 'Pizza' : cat);
            if (selected === 'all' || selected === cat) {
                if (head) head.style.display = 'flex';
                if (section) section.style.display = 'grid';
            } else {
                if (head) head.style.display = 'none';
                if (section) section.style.display = 'none';
            }
        });
    }

    // Search function
    function searchItems() {
        var input = document.getElementById('searchInput').value.toLowerCase();
        var allCards = document.querySelectorAll('.food-card');
        allCards.forEach(function(card) {
            var name = card.querySelector('.food-name').textContent.toLowerCase();
            var desc = card.querySelector('.food-description').textContent.toLowerCase();
            if (name.includes(input) || desc.includes(input)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Update order count dynamically by querying checkboxes
    function updateOrderCount() {
        var checkboxes = document.querySelectorAll('.custom-checkbox');
        var count = 0;
        checkboxes.forEach(function(cb) {
            if (cb.checked) count++;
        });
        var orderCountElem = document.getElementById('orderCount');
        if (orderCountElem) orderCountElem.textContent = count;
    }

    // Attach change listeners to all checkboxes now and when DOM is ready
    function bindCheckboxListeners() {
        var checkboxes = document.querySelectorAll('.custom-checkbox');
        checkboxes.forEach(function(cb) {
            cb.removeEventListener('change', updateOrderCount);
            cb.addEventListener('change', updateOrderCount);
        });
    }

    // Prepare the order data and store to stateService dynamically
    function orderedList() { // Removed 'source' as it's no longer used
        console.log('orderedList function called in menu.js');
        var checkboxes = document.querySelectorAll('.custom-checkbox');
        var itemsChecked = false;
        checkboxes.forEach(function(cb) {
            if (cb.checked) itemsChecked = true;
        });

        if (!itemsChecked) {
            alert('Please select at least one item to proceed!');
            return false;
        }

        // Clear the cart before adding new items to prevent duplicates on subsequent calls
        // stateService.clearCart();

        // For every checkbox, add item to stateService
        checkboxes.forEach(function(cb) {
            var id = cb.id || '';
            var idx = parseInt(id.replace('item',''));
            if (isNaN(idx)) return;
            var qtyInput = document.getElementById('qty' + idx);
            var qty = qtyInput ? parseInt(qtyInput.value) : 1;
            if (isNaN(qty) || qty < 1) qty = 1;
            var card = cb.closest('.food-card');
            if (cb.checked && card) {
                var nameElem = card.querySelector('.food-name');
                var priceElem = card.querySelector('.food-price');
                var name = nameElem ? nameElem.textContent.trim() : ('Item ' + idx);
                var priceText = priceElem ? priceElem.textContent : '0';
                var price = parseFloat(priceText.replace(/[^0-9\.]/g, '')) || 0;
                stateService.addToCart({ id: idx, name, quantity: qty, price });
                console.log('Item added to cart:', { id: idx, name, quantity: qty, price });
            }
        });
        console.log('Cart after adding items:', stateService.cart);

        return true;
    }

    // Expose functions to the global scope for HTML attributes
    window.filterCategory = filterCategory;
    window.searchItems = searchItems;
    window.goBack = function() {
        window.location.href = 'QuickOrder.html';
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        bindCheckboxListeners();
        updateOrderCount();

        const orderButton = document.getElementById('orderButton');
        if (orderButton) {
            orderButton.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default form submission
                if (orderedList()) { // Call orderedList to populate cart
                    window.location.href = 'orderedList.html'; // Redirect
                }
            });
        }

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.href = 'QuickOrder.html';
            });
        }
    });
})();