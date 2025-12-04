# Shopping Cart Module - Developer Reference

## API Reference

### MenuCartComponent

#### Constructor
```javascript
const cart = new MenuCartComponent(cartContainerId);
```

**Parameters**:
- `cartContainerId` (string): ID of container element (default: 'menu-cart-modal')

**Example**:
```javascript
import MenuCartComponent from './components/menu-cart.component.js';

// Initialize cart component
const menuCart = new MenuCartComponent('menu-cart-modal');

// Open cart
menuCart.openCart();

// Close cart
menuCart.closeCart();
```

#### Methods

##### `openCart()`
Opens the shopping cart sidebar.

```javascript
menuCart.openCart();
```

**Returns**: void

##### `closeCart()`
Closes the shopping cart sidebar.

```javascript
menuCart.closeCart();
```

**Returns**: void

##### `removeItem(cartItemId)`
Removes an item from the cart.

```javascript
menuCart.removeItem('item123_Cheese');
```

**Parameters**:
- `cartItemId` (string): Unique cart item ID

**Returns**: void

##### `updateQuantity(cartItemId, change)`
Updates the quantity of a cart item.

```javascript
menuCart.updateQuantity('item123_Cheese', 1);  // Increase by 1
menuCart.updateQuantity('item123_Cheese', -1); // Decrease by 1
```

**Parameters**:
- `cartItemId` (string): Unique cart item ID
- `change` (number): Quantity change (+1 or -1)

**Returns**: void

##### `clearCart()`
Clears all items from the cart (with confirmation).

```javascript
menuCart.clearCart();
```

**Returns**: void

##### `proceedToCheckout()`
Navigates to the checkout page.

```javascript
menuCart.proceedToCheckout();
```

**Returns**: void

##### `calculateTotal()`
Calculates the total price of all items in cart.

```javascript
const total = menuCart.calculateTotal();
console.log(total); // e.g., 450.50
```

**Returns**: number (total price)

##### `render()`
Re-renders the cart UI.

```javascript
menuCart.render();
```

**Returns**: void

---

### State Service Integration

#### Adding Item to Cart
```javascript
import { stateService } from './services/state.service.js';

const cartItem = {
  id: 'itemId_Cheese',
  itemId: 'itemId',
  name: 'Burger',
  quantity: 1,
  price: 170.00,
  selectedVariations: [
    {
      variationName: 'Cheese',
      selectedOption: 'With Cheese',
      priceModifier: 20.00
    }
  ]
};

stateService.addToCart(cartItem);
```

#### Removing Item from Cart
```javascript
stateService.removeFromCart('itemId_Cheese');
```

#### Updating Cart
```javascript
const updatedCart = [
  { id: 'item1', quantity: 2, price: 300 },
  { id: 'item2', quantity: 1, price: 150 }
];

stateService.updateCart(updatedCart);
```

#### Clearing Cart
```javascript
stateService.clearCart();
```

#### Subscribing to Cart Changes
```javascript
// Subscribe to cart updates
stateService.subscribe('cart', (cart) => {
  console.log('Cart updated:', cart);
  // Update UI
});
```

---

## CSS Classes Reference

### Modal Structure
```
.menu-cart-modal                      // Main container
├── .menu-cart-overlay                // Semi-transparent background
└── .menu-cart-panel                  // Sidebar panel
    ├── .menu-cart-header             // Header section
    │   ├── h2                        // Title
    │   └── .menu-cart-close-btn      // Close button
    ├── .menu-cart-body               // Items container
    │   └── .menu-cart-items          // Items list
    │       ├── .menu-cart-empty      // Empty state (when no items)
    │       └── .menu-cart-item       // Individual item
    │           ├── .menu-cart-item-content
    │           │   ├── .menu-cart-item-name
    │           │   ├── .menu-cart-item-variations
    │           │   │   └── .menu-cart-variation-badge
    │           │   ├── .menu-cart-edit-variations-btn
    │           │   └── .menu-cart-item-price
    │           └── .menu-cart-item-controls
    │               ├── .menu-cart-qty-decrease
    │               ├── .menu-cart-qty
    │               ├── .menu-cart-qty-increase
    │               └── .menu-cart-remove-btn
    └── .menu-cart-footer             // Footer section
        ├── .menu-cart-total          // Total price display
        └── .menu-cart-actions        // Buttons
            ├── .menu-cart-btn-secondary
            └── .menu-cart-btn-primary
```

### Button Classes
```css
.menu-cart-btn              /* Base button */
.menu-cart-btn-primary      /* Green checkout button */
.menu-cart-btn-secondary    /* White clear cart button */
.menu-cart-item-btn         /* Action buttons (-, +, delete) */
.menu-cart-close-btn        /* Close modal button */
```

---

## Event System

### Cart Item Events

#### Add to Cart (via checkbox)
```javascript
// When checkbox changes:
// 1. validateVariations()
// 2. calculatePrice()
// 3. generateCartItemId()
// 4. stateService.addToCart()
// 5. menuCart.render()
```

#### Remove Item
```javascript
// When trash icon clicked:
// 1. stateService.removeFromCart(cartItemId)
// 2. menuCart.render()
```

#### Update Quantity
```javascript
// When +/- button clicked:
// 1. Calculate new quantity
// 2. stateService.updateCart()
// 3. menuCart.render()
```

---

## Variation Handling

### Variation Structure (from inventory)
```javascript
{
  variationName: "Cheese",
  options: [
    {
      optionName: "No Cheese",
      priceModifier: 0,
      isAvailable: true,
      quantity: 100
    },
    {
      optionName: "With Cheese",
      priceModifier: 20,
      isAvailable: true,
      quantity: 100
    }
  ]
}
```

### Price Modifier Calculation
```javascript
// Formula:
finalPrice = basePrice + sum(selectedVariations.priceModifier)

// Example:
basePrice = 150
selectedVariations = [
  { priceModifier: 20 },  // Cheese
  { priceModifier: 30 }   // Size Large
]
finalPrice = 150 + 20 + 30 = 200
```

### Unique Cart Item ID Generation
```javascript
// Pattern: itemId_option1_option2_option3...

// Example 1: No variations
id = "itemId"

// Example 2: With variations
id = "itemId_WithCheese_Large_Bacon"

// This allows same item with different variations
// to be separate cart entries
```

---

## State Management Flow

### Cart State Structure
```javascript
{
  cart: [
    {
      id: "itemId_variation",
      itemId: "mongoId",
      name: "Item Name",
      quantity: 1,
      price: 150.00,
      selectedVariations: [
        {
          variationName: "Type",
          selectedOption: "Option",
          priceModifier: 20.00
        }
      ]
    }
  ]
}
```

### State Persistence
```javascript
// Stored in sessionStorage as JSON:
sessionStorage.setItem('cart', JSON.stringify(cart));

// Retrieved on page load:
const savedCart = JSON.parse(sessionStorage.getItem('cart'));
```

---

## Extending the Module

### Add New Button Action
```javascript
// In menu-cart.component.js bindEvents():
itemsContainer.addEventListener('click', (e) => {
  const target = e.target.closest('.my-new-button');
  if (target) {
    const cartItemId = target.dataset.cartItemId;
    this.myNewAction(cartItemId);
  }
});

// Add method:
myNewAction(cartItemId) {
  const cart = stateService.cart;
  const item = cart.find(i => i.id === cartItemId);
  if (item) {
    // Do something
  }
}
```

### Add Custom Variation Badge
```javascript
// In render() method, modify variation rendering:
${item.selectedVariations.map(v => `
  <span class="menu-cart-variation-badge">
    ${v.variationName}: <strong>${v.selectedOption}</strong>
    ${v.priceModifier !== 0 ? `(+₱${Math.abs(v.priceModifier)})` : ''}
  </span>
`).join('')}
```

### Customize Cart Modal Size
```css
/* In menu-cart.css */
.menu-cart-panel {
  max-width: 500px; /* Change from 450px */
}

@media (max-width: 600px) {
  .menu-cart-panel {
    max-width: 100%; /* Full screen on mobile */
  }
}
```

---

## Debugging

### Enable Logging
```javascript
// In menu.js, after importing MenuCartComponent:
console.log('[Menu] Menu cart component initialized');

// In menu-cart.component.js:
console.log('[Cart] Rendering cart with items:', stateService.cart);
```

### Inspect Cart State
```javascript
// In browser console:
const savedCart = JSON.parse(sessionStorage.getItem('cart'));
console.log('Current cart:', savedCart);
```

### Check Event Binding
```javascript
// Verify event listeners attached:
const itemsContainer = document.getElementById('menu-cart-items');
console.log('Event listeners:', getEventListeners(itemsContainer));
```

### Monitor State Changes
```javascript
// Subscribe to see all updates:
stateService.subscribe('cart', (cart) => {
  console.log('Cart changed:', cart);
  console.log('Total items:', cart.length);
  console.log('Total price:', cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
});
```

---

## Performance Optimization Tips

### 1. Reduce Re-renders
```javascript
// Instead of re-rendering entire cart:
// Only update changed items
updateSingleItem(cartItemId) {
  const item = stateService.cart.find(i => i.id === cartItemId);
  const itemElement = document.querySelector(`[data-cart-item-id="${cartItemId}"]`);
  if (itemElement && item) {
    itemElement.querySelector('.menu-cart-qty').textContent = item.quantity;
  }
}
```

### 2. Debounce Updates
```javascript
// For rapid quantity updates:
const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const updateQuantityDebounced = debounce((itemId, change) => {
  this.updateQuantity(itemId, change);
}, 300);
```

### 3. Lazy Load Cart Component
```javascript
// Initialize only when needed:
let menuCart = null;

cartButton.addEventListener('click', () => {
  if (!menuCart) {
    menuCart = new MenuCartComponent('menu-cart-modal');
  }
  menuCart.openCart();
});
```

---

## Common Patterns

### Add Item with Validation
```javascript
function validateAndAddItem(itemId, variations, quantity) {
  // Validate variations
  if (variations.length === 0) {
    console.warn('No variations selected');
    return false;
  }

  // Check if all required variations are selected
  const hasAllVariations = variations.every(v => v.selectedOption);
  if (!hasAllVariations) {
    alert('Please select all variation options');
    return false;
  }

  // Create cart item
  const cartItem = {
    id: generateCartItemId(itemId, variations),
    itemId,
    name: 'Item Name',
    quantity,
    price: calculatePrice(itemId, variations),
    selectedVariations: variations
  };

  stateService.addToCart(cartItem);
  return true;
}
```

### Calculate Subtotal
```javascript
function calculateSubtotal(quantity, price) {
  return quantity * price;
}

// Usage:
const subtotal = calculateSubtotal(cart.quantity, cart.price);
```

### Generate Unique IDs
```javascript
function generateCartItemId(itemId, variations) {
  if (variations.length === 0) {
    return itemId;
  }
  
  const variantString = variations
    .map(v => v.selectedOption.replace(/\s+/g, '_'))
    .join('_');
  
  return `${itemId}_${variantString}`;
}
```

---

## Troubleshooting Guide

### Cart Not Updating
```javascript
// Check 1: State service subscription
const unsub = stateService.subscribe('cart', () => {
  console.log('Cart update received');
});

// Check 2: Component initialization
console.log('MenuCart instance:', menuCart);

// Check 3: Render method
menuCart.render(); // Force render
```

### Items Not Being Added
```javascript
// Check 1: Checkbox event firing
document.addEventListener('change', (e) => {
  console.log('Change event:', e.target);
});

// Check 2: Validation
console.log('Variations:', variations);
console.log('Price:', calculatePrice(itemId, variations));

// Check 3: State update
console.log('Cart before:', stateService.cart);
stateService.addToCart(item);
console.log('Cart after:', stateService.cart);
```

### Styling Issues
```javascript
// Check CSS is loaded:
const styles = document.styleSheets;
console.log('Stylesheets:', Array.from(styles).map(s => s.href));

// Check cart modal element:
const cartModal = document.getElementById('menu-cart-modal');
console.log('Cart modal:', cartModal);
console.log('Computed styles:', window.getComputedStyle(cartModal));
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-05 | Initial release |

---

## License & Credits

- **Feature**: Shopping Cart Module
- **Implemented**: December 2025
- **Status**: Production Ready
- **Maintainers**: Quick Order Development Team

---

This reference covers all aspects of the Shopping Cart Module. For questions or updates, refer to the main implementation files.
