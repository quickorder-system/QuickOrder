import { stateService } from './services/state.service.js';
import MenuCartComponent from './components/menu-cart.component.js';

(() => {
    let allItems = []; // Store all fetched items globally
    let menuCart = null; // Global reference to menu cart component
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

    // Generate HTML for variation selectors
    function generateVariationsHTML(item, itemId, basePrice) {
        if (!item.variations || item.variations.length === 0) {
            return '';
        }

        let variationsHTML = '<div class="variations-container">';
        
        item.variations.forEach((variation, varIndex) => {
            variationsHTML += `
                <div class="variation-group">
                    <label class="variation-label">${variation.variationName}:</label>
                    <select data-variation-id="${itemId}" data-variation-index="${varIndex}" class="variation-select">
                        <option value="">-- Select ${variation.variationName} --</option>
            `;

            variation.options.forEach((option, optIndex) => {
                const priceDisplay = option.priceModifier !== 0 
                    ? ` (+₱${Math.abs(option.priceModifier).toFixed(2)})` 
                    : '';
                const isDisabled = !option.isAvailable || option.quantity <= 0;
                const disabledAttr = isDisabled ? 'disabled' : '';
                
                variationsHTML += `
                    <option 
                        value="${optIndex}" 
                        data-price-modifier="${option.priceModifier}" 
                        data-option-name="${option.optionName}"
                        ${disabledAttr}
                    >
                        ${option.optionName}${priceDisplay}
                    </option>
                `;
            });

            variationsHTML += `
                    </select>
                </div>
            `;
        });

        variationsHTML += '</div>';
        return variationsHTML;
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
                    const variationsHTML = generateVariationsHTML(fullItem, itemId, price);
                    
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
                                ${variationsHTML}
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
                    const variationsHTML = generateVariationsHTML(item, itemId, price);
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
                                ${variationsHTML}
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

    // Bind checkbox listeners (works with dynamic elements)
    function bindCheckboxListeners() {
        const checkboxes = document.querySelectorAll('[data-item-checkbox]');
        checkboxes.forEach(cb => {
            cb.removeEventListener('change', handleCheckboxChange);
            cb.addEventListener('change', handleCheckboxChange);
        });
    }

    // Handle checkbox change event - add/remove items from cart
    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const itemId = checkbox.getAttribute('data-item-checkbox');
        const card = checkbox.closest('.food-card');
        
        if (!card) return;

        if (checkbox.checked) {
            // Add item to cart
            const nameElem = card.querySelector('.food-name');
            const priceElem = card.querySelector('.food-price');
            const qtyInput = card.querySelector('[data-qty-id]');
            
            const name = nameElem ? nameElem.textContent.trim() : 'Unknown Item';
            const basePriceText = priceElem ? priceElem.textContent : '0';
            let price = parseFloat(basePriceText.replace(/[^0-9\.]/g, '')) || 0;
            const qty = qtyInput ? parseInt(qtyInput.value) : 1;
            
            // Capture selected variations
            const selectedVariations = [];
            const variationSelects = card.querySelectorAll('.variation-select');
            let hasInvalidVariations = false;
            
            variationSelects.forEach(select => {
                if (select.value === '') {
                    const allEmpty = Array.from(variationSelects).every(s => s.value === '');
                    if (!allEmpty) {
                        console.warn('[Menu] Variation not selected:', select.getAttribute('data-variation-index'));
                        hasInvalidVariations = true;
                    }
                } else {
                    const variationIndex = select.getAttribute('data-variation-index');
                    const optionIndex = select.value;
                    const selectedOption = select.options[select.selectedIndex];
                    const optionName = selectedOption.getAttribute('data-option-name');
                    const priceModifier = parseFloat(selectedOption.getAttribute('data-price-modifier')) || 0;
                    const variationName = select.options[select.selectedIndex].parentElement?.label || 
                                          allItems.find(item => String(item._id) === String(itemId))?.variations?.[variationIndex]?.variationName || '';
                    
                    selectedVariations.push({
                        variationName,
                        selectedOption: optionName,
                        priceModifier
                    });
                    
                    price += priceModifier;
                    console.log('[Menu] Variation selected:', { variationName, selectedOption: optionName, priceModifier });
                }
            });
            
            if (variationSelects.length > 0 && hasInvalidVariations) {
                alert(`Please select all options for "${name}" before adding to cart.`);
                checkbox.checked = false;
                return;
            }
            
            // Generate unique cart item ID
            const variantHash = selectedVariations.length > 0 
                ? '_' + selectedVariations.map(v => v.selectedOption.replace(/\s+/g, '_')).join('_')
                : '';
            const cartItemId = itemId + variantHash;
            
            const cartItem = { 
                id: cartItemId,
                itemId: itemId,
                name, 
                quantity: qty, 
                price,
                selectedVariations: selectedVariations.length > 0 ? selectedVariations : undefined
            };
            
            stateService.addToCart(cartItem);
            console.log('[Menu] Item added to cart:', cartItem);
        } else {
            // Remove item from cart
            // If item has variations, we need to find the right cart entry
            const variationSelects = card.querySelectorAll('.variation-select');
            const selectedVariations = [];
            
            variationSelects.forEach(select => {
                if (select.value !== '') {
                    const selectedOption = select.options[select.selectedIndex];
                    const optionName = selectedOption.getAttribute('data-option-name');
                    selectedVariations.push({
                        selectedOption: optionName
                    });
                }
            });
            
            const variantHash = selectedVariations.length > 0 
                ? '_' + selectedVariations.map(v => v.selectedOption.replace(/\s+/g, '_')).join('_')
                : '';
            const cartItemId = itemId + variantHash;
            
            stateService.removeFromCart(cartItemId);
            console.log('[Menu] Item removed from cart:', cartItemId);
        }

        // Update cart count
        const cartCountElem = document.getElementById('cartCount');
        if (cartCountElem) {
            cartCountElem.textContent = stateService.cart.length;
        }
    }

    // Prepare order data with MongoDB IDs and variations (for backward compatibility if needed)
    function orderedList() {
        console.log('[Menu] orderedList function called');
        const cart = stateService.cart;
        
        if (cart.length === 0) {
            alert('Please add at least one item to your cart!');
            return false;
        }
        
        // Navigate to ordered list page
        window.location.href = 'orderedList.html';
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
        
        // Initialize the menu cart component
        menuCart = new MenuCartComponent('menu-cart-modal');
        console.log('[Menu] Menu cart component initialized');
        
        // Subscribe to cart changes to update count badge
        stateService.subscribe('cart', () => {
            const cartCountElem = document.getElementById('cartCount');
            if (cartCountElem) {
                cartCountElem.textContent = stateService.cart.length;
            }
        });
        
        // Render menu from inventory
        await renderMenu();

        // Set up event listeners
        const cartButton = document.getElementById('cartButton');
        if (cartButton) {
            cartButton.addEventListener('click', function(event) {
                event.preventDefault();
                menuCart.openCart();
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
        
        // Update initial cart count
        const cartCountElem = document.getElementById('cartCount');
        if (cartCountElem) {
            cartCountElem.textContent = stateService.cart.length;
        }
    });
})();
