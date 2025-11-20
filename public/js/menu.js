import { stateService } from './services/state.service.js';

(() => {
    let allItems = []; // Store all fetched items globally
    const categoryIcons = {
        burger: '',
        pizza: '',
        others: '',
        drinks: '',
        rice: '',
        pasta: '',
        coffee: '',
        bundle: ''
    };

    const categoryLabels = {
        burger: 'Burgers',
        pizza: 'Pizza',
        others: 'Snacks',
        drinks: 'Drinks',
        rice: 'Rice Meals',
        pasta: 'Pasta',
        coffee: 'Coffee',
        bundle: 'Bundle Meals'
    };

    // Fetch inventory from API
    async function fetchInventory() {
        try {
            console.log('[Menu] Fetching inventory from /api/inventory');
            const response = await fetch('/api/inventory');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const items = await response.json();
            console.log('[Menu] Inventory fetched:', items);
            return items;
        } catch (error) {
            console.error('[Menu] Error fetching inventory:', error);
            alert('Failed to load menu items. Please refresh the page.');
            return [];
        }
    }

    // Update category dropdown with custom categories
    function updateCategoryDropdown(itemsByCategory) {
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect) return;

        const predefinedCategories = ['burger', 'pizza', 'others', 'drinks', 'rice', 'pasta', 'coffee', 'bundle'];
        const categoryLabelsMap = {
            burger: 'Burgers',
            pizza: 'Pizza',
            others: 'Snacks',
            drinks: 'Drinks',
            rice: 'Rice Meals',
            pasta: 'Pastas',
            coffee: 'Coffee',
            bundle: 'Bundle Meals'
        };

        // Normalize category keys to lowercase for comparison
        const normalizedItemsByCategory = {};
        Object.keys(itemsByCategory).forEach(cat => {
            const normalizedCat = cat.toLowerCase().trim();
            normalizedItemsByCategory[normalizedCat] = itemsByCategory[cat];
        });

        // Get custom categories that exist in inventory
        const customCategories = Object.keys(normalizedItemsByCategory).filter(cat => !predefinedCategories.includes(cat));

        // Clear options except the "All Categories" default
        const options = categorySelect.querySelectorAll('option');
        options.forEach((option, index) => {
            if (index > 0) { // Keep "All Categories"
                option.remove();
            }
        });

        // Re-add predefined categories that exist in inventory
        predefinedCategories.forEach(cat => {
            if (normalizedItemsByCategory[cat]) {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = categoryLabelsMap[cat] || cat;
                categorySelect.appendChild(option);
            }
        });

        // Add custom categories (sorted alphabetically)
        customCategories.sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            // Format custom category name: capitalize words
            option.textContent = cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            categorySelect.appendChild(option);
        });

        console.log('[Menu] Category dropdown updated. Available categories:', Object.keys(normalizedItemsByCategory));
        console.log('[Menu] Custom categories found:', customCategories);
        console.log('[Menu] Dropdown now has', categorySelect.options.length, 'options');
    }

    // Fetch popular items from completed orders
    async function fetchPopularItems() {
        try {
            console.log('[Menu] Fetching popular items from completed orders');
            const response = await fetch('/api/reports/popular-items');
            if (!response.ok) {
                console.warn('Could not fetch popular items:', response.status);
                return [];
            }
            const data = await response.json();
            console.log('[Menu] Popular items fetched:', data);
            return data.items || [];
        } catch (error) {
            console.error('[Menu] Error fetching popular items:', error);
            return [];
        }
    }

    // Render menu dynamically from inventory
    async function renderMenu() {
        const menuContainer = document.getElementById('dynamic-menu-container');
        if (!menuContainer) {
            console.error('[Menu] Container element not found');
            return;
        }

        // Fetch inventory
        allItems = await fetchInventory();
        if (allItems.length === 0) {
            menuContainer.innerHTML = '<p style="text-align: center; padding: 40px;">No menu items available. Please try again later.</p>';
            return;
        }

        // Group items by category (normalized to lowercase)
        const itemsByCategory = {};
        allItems.forEach(item => {
            const category = (item.category || 'others').toLowerCase().trim();
            if (!itemsByCategory[category]) {
                itemsByCategory[category] = [];
            }
            itemsByCategory[category].push(item);
        });

        console.log('[Menu] Items grouped by category:', itemsByCategory);

        // Update category dropdown with custom categories
        updateCategoryDropdown(itemsByCategory);

        // Fetch popular items and prepare data
        const popularItemsData = await fetchPopularItems();
        const popularItemsMap = new Map(popularItemsData.map(item => [item.itemId, item]));

        // Render categories in order - predefined first, then custom categories
        const predefinedCategoryOrder = ['burger', 'pizza', 'others', 'drinks', 'rice', 'pasta', 'coffee', 'bundle'];
        const customCategories = Object.keys(itemsByCategory).filter(cat => !predefinedCategoryOrder.includes(cat));
        const categoryOrder = [...predefinedCategoryOrder, ...customCategories];
        let menuHTML = '';
        let itemCounter = 0;

        // Add Popular Items section at the top if there are any
        if (popularItemsData.length > 0) {
            menuHTML += `
                <div id="popularhead" class="section-header">
                    <h2>⭐ Popular Items</h2>
                </div>
                <div id="popular" class="menu-grid">
            `;

            // Render popular items
            popularItemsData.slice(0, 10).forEach((popularItem) => {
                // Find the item in allItems to get full details - compare as strings
                const fullItem = allItems.find(item => String(item._id) === String(popularItem.itemId));
                if (fullItem) {
                    itemCounter++;
                    const itemId = fullItem._id || `item-${itemCounter}`;
                    const image = fullItem.image || '';
                    const price = fullItem.price || 0;
                    const description = fullItem.description || 'No description available';
                    const name = fullItem.itemName || 'Unknown Item';
                    const quantity = fullItem.quantity || 0;
                    const isAvailable = (fullItem.isAvailable !== false) && (quantity > 0);
                    
                    const unavailableClass = !isAvailable ? 'unavailable' : '';
                    const outOfStockReason = quantity <= 0 ? 'Out of Stock' : 'Unavailable';
                    const availabilityBadge = !isAvailable ? `<span class="difficulty-badge badge-unavailable">${outOfStockReason}</span>` : '';
                    const disabledAttr = !isAvailable ? 'disabled' : '';
                    const orderCount = popularItem.orderCount || 0;

                    menuHTML += `
                        <div class="food-card ${unavailableClass}" data-item-id="${itemId}" data-item-name="${name}" data-item-price="${price}" data-available="${isAvailable}">
                            ${availabilityBadge}
                            <span class="popularity-badge">${orderCount} orders</span>
                            ${image ? `<img src="${image}" alt="${name}" class="food-image">` : ''}
                            <div class="food-details">
                                <div class="food-header">
                                    <div class="food-name">${name}</div>
                                    <div class="food-price">₱${price.toFixed(2)}</div>
                                </div>
                                <div class="food-description">${description}</div>
                                <div class="food-actions">
                                    <div class="quantity-control">
                                        <span class="qty-label">Qty:</span>
                                        <input type="number" data-qty-id="${itemId}" min="1" value="1" max="10" class="qty-input" ${disabledAttr}>
                                    </div>
                                    <input type="checkbox" data-item-checkbox="${itemId}" class="custom-checkbox" title="Add to order" ${disabledAttr}>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            menuHTML += '</div>';
        }

        categoryOrder.forEach(category => {
            if (itemsByCategory[category] && itemsByCategory[category].length > 0) {
                // For custom categories, format the label by capitalizing words
                let categoryLabel = categoryLabels[category];
                if (!categoryLabel) {
                    categoryLabel = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                }
                
                menuHTML += `
                    <div id="${category}head" class="section-header">
                        <h2>${categoryLabel}</h2>
                    </div>
                    <div id="${category}" class="menu-grid">
                `;

                itemsByCategory[category].forEach(item => {
                    itemCounter++;
                    const itemId = item._id || `item-${itemCounter}`;
                    const image = item.image || '';
                    const price = item.price || 0;
                    const description = item.description || 'No description available';
                    const name = item.itemName || 'Unknown Item';
                    const quantity = item.quantity || 0;
                    // Check both isAvailable flag AND quantity > 0
                    const isAvailable = (item.isAvailable !== false) && (quantity > 0);
                    
                    // CSS classes for availability
                    const unavailableClass = !isAvailable ? 'unavailable' : '';
                    const outOfStockReason = quantity <= 0 ? 'Out of Stock' : 'Unavailable';
                    const availabilityBadge = !isAvailable ? `<span class="difficulty-badge badge-unavailable">${outOfStockReason}</span>` : '';
                    
                    // Disabled attribute for checkbox
                    const disabledAttr = !isAvailable ? 'disabled' : '';

                    menuHTML += `
                        <div class="food-card ${unavailableClass}" data-item-id="${itemId}" data-item-name="${name}" data-item-price="${price}" data-available="${isAvailable}">
                            ${availabilityBadge}
                            ${image ? `<img src="${image}" alt="${name}" class="food-image">` : ''}
                            <div class="food-details">
                                <div class="food-header">
                                    <div class="food-name">${name}</div>
                                    <div class="food-price">₱${price.toFixed(2)}</div>
                                </div>
                                <div class="food-description">${description}</div>
                                <div class="food-actions">
                                    <div class="quantity-control">
                                        <span class="qty-label">Qty:</span>
                                        <input type="number" data-qty-id="${itemId}" min="1" value="1" max="10" class="qty-input" ${disabledAttr}>
                                    </div>
                                    <input type="checkbox" data-item-checkbox="${itemId}" class="custom-checkbox" title="Add to order" ${disabledAttr}>
                                </div>
                            </div>
                        </div>
                    `;
                });

                menuHTML += '</div>';
            }
        });

        // Insert the rendered menu
        menuContainer.innerHTML = menuHTML;

        // Rebind event listeners
        bindCheckboxListeners();
        updateOrderCount();
    }

    // Category filter function (works with dynamic elements)
    function filterCategory() {
        const categorySelect = document.getElementById('categorySelect');
        const selected = categorySelect.value;
        
        if (selected === 'all') {
            // Show all categories
            document.querySelectorAll('[id$="head"]').forEach(el => el.style.display = 'flex');
            document.querySelectorAll('.menu-grid').forEach(el => el.style.display = 'flex');
        } else {
            // Hide all categories first
            document.querySelectorAll('[id$="head"]').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.menu-grid').forEach(el => el.style.display = 'none');
            
            // Show selected category
            const headId = selected + 'head';
            const gridId = selected;
            const head = document.getElementById(headId);
            const grid = document.getElementById(gridId);
            if (head) head.style.display = 'flex';
            if (grid) grid.style.display = 'flex';
        }
    }

    // Search function (works with dynamic elements)
    function searchItems() {
        const input = document.getElementById('searchInput').value.toLowerCase();
        const allCards = document.querySelectorAll('.food-card');
        
        allCards.forEach(card => {
            const name = card.querySelector('.food-name')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.food-description')?.textContent.toLowerCase() || '';
            
            if (name.includes(input) || desc.includes(input)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Update order count dynamically
    function updateOrderCount() {
        const checkboxes = document.querySelectorAll('[data-item-checkbox]');
        let count = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) count++;
        });
        const orderCountElem = document.getElementById('orderCount');
        if (orderCountElem) orderCountElem.textContent = count;
    }

    // Bind checkbox listeners (works with dynamic elements)
    function bindCheckboxListeners() {
        const checkboxes = document.querySelectorAll('[data-item-checkbox]');
        checkboxes.forEach(cb => {
            cb.removeEventListener('change', updateOrderCount);
            cb.addEventListener('change', updateOrderCount);
        });
    }

    // Prepare order data with MongoDB IDs
    function orderedList() {
        console.log('[Menu] orderedList function called');
        const checkboxes = document.querySelectorAll('[data-item-checkbox]');
        let itemsChecked = false;
        
        checkboxes.forEach(cb => {
            if (cb.checked) itemsChecked = true;
        });

        if (!itemsChecked) {
            alert('Please select at least one item to proceed!');
            return false;
        }

        // Clear cart first to prevent duplication
        stateService.clearCart();

        // Add items to cart using MongoDB _id
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const itemId = cb.getAttribute('data-item-checkbox');
                const card = cb.closest('.food-card');
                
                if (card) {
                    const nameElem = card.querySelector('.food-name');
                    const priceElem = card.querySelector('.food-price');
                    const qtyInput = card.querySelector('[data-qty-id]');
                    
                    const name = nameElem ? nameElem.textContent.trim() : 'Unknown Item';
                    const priceText = priceElem ? priceElem.textContent : '0';
                    const price = parseFloat(priceText.replace(/[^0-9\.]/g, '')) || 0;
                    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
                    
                    // Use MongoDB _id for cart item ID
                    stateService.addToCart({ 
                        id: itemId,  // MongoDB _id 
                        name, 
                        quantity: qty, 
                        price 
                    });
                    console.log('[Menu] Item added to cart:', { id: itemId, name, quantity: qty, price });
                }
            }
        });

        console.log('[Menu] Cart after adding items:', stateService.cart);
        return true;
    }

    // Expose functions to global scope
    window.filterCategory = filterCategory;
    window.searchItems = searchItems;
    window.orderedList = orderedList;
    window.refreshMenu = renderMenu;
    window.goBack = function() {
        window.location.href = 'QuickOrder.html';
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('[Menu] DOMContentLoaded event fired');
        
        // Render menu from inventory
        await renderMenu();

        // Set up event listeners
        const orderButton = document.getElementById('orderButton');
        if (orderButton) {
            orderButton.addEventListener('click', function(event) {
                event.preventDefault();
                if (orderedList()) {
                    window.location.href = 'orderedList.html';
                }
            });
        }

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.href = 'QuickOrder.html';
            });
        }

        // Trigger initial category filter to organize display
        filterCategory();
    });
})();
