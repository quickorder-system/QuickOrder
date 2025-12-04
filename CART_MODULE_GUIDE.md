# Shopping Cart Module in Menu - Feature Documentation

## Overview
We've implemented a **Shopping Cart Module directly in the Menu page** that solves the loophole where users couldn't add the same item with different variations separately.

## Problem Solved
**Previous Issue**: Users couldn't order the same item (e.g., 2 burgers) with different variations (one with cheese, one without) in a single order session.

**Solution**: The new cart system allows users to:
1. Add multiple quantities of the same item
2. Apply **different variations** to each instance
3. Each variation combination is treated as a **separate cart entry**
4. Manage all items with a live shopping cart sidebar

## How It Works

### Adding Items to Cart
1. **Select Variations**: Choose options from the variation dropdowns for each item
2. **Set Quantity**: Use the quantity input to set how many you want
3. **Add to Cart**: Check the checkbox to add the item to the cart
   - If variations are available, you MUST select all of them
   - If no variations are needed, just check the box

### Key Features

#### Example Workflow: Ordering 2 Burgers with Different Variations
1. Find the first Burger item
2. Select "With Cheese" from the variations
3. Set quantity to 1
4. Check the checkbox → First burger added to cart

5. Find the same Burger item again in the menu
6. Select "No Cheese" from the variations
7. Set quantity to 1
8. Check the checkbox → Second burger (different variation) added as separate cart entry

Result: Cart shows 2 burger entries with different variations!

#### Cart Sidebar Features
- **View Cart Button**: Click the floating "View Cart" button in the bottom-right to open the cart sidebar
- **Live Updates**: Cart updates in real-time as you add/remove items
- **Quantity Controls**: Adjust quantities in the cart using +/- buttons
- **Item Count Badge**: See total number of items in the cart
- **Cart Summary**: View total price instantly
- **Clear Cart**: Remove all items at once
- **Proceed to Checkout**: Move to the order confirmation page

### Technical Implementation

#### New Files
1. **`public/js/components/menu-cart.component.js`**
   - MenuCartComponent class handles all cart operations
   - Real-time cart rendering and updates
   - Event handling for add/remove/quantity operations

2. **`public/css/menu-cart.css`**
   - Responsive design for cart sidebar
   - Slide-in animation on mobile
   - Dark mode support
   - Touch-friendly buttons and controls

#### Updated Files
1. **`public/js/menu.js`**
   - Imported MenuCartComponent
   - Updated checkbox event handling
   - Integrated real-time cart updates
   - Changed "View Order" button to "View Cart"

2. **`public/menu.html`**
   - Added menu-cart.css link
   - Updated button ID from orderButton to cartButton
   - Changed button text to "View Cart"

3. **`public/js/services/state.service.js`** (No changes needed)
   - Already had all required methods
   - Uses sessionStorage for cart persistence

## Cart Item Structure

Each item in the cart contains:
```javascript
{
  id: "itemId_variation1_variation2",  // Unique ID including variations
  itemId: "mongoDBObjectId",            // Original item ID
  name: "Burger",                       // Item name
  quantity: 1,                          // Quantity
  price: 150.00,                        // Final price with modifiers
  selectedVariations: [                 // Array of selected variations
    {
      variationName: "Cheese",
      selectedOption: "With Cheese",
      priceModifier: 20.00
    }
  ]
}
```

## Variation Price Modifiers

- Base item price is shown in the menu
- Variations can have price modifiers (+ or - amount)
- Final cart price = Base Price + Sum of Price Modifiers
- Example: Burger (₱150) + Cheese (+₱20) = ₱170 in cart

## Cart Persistence

- Cart is stored in **sessionStorage**
- Cart persists during the session
- Cart is cleared when:
  - User manually clears it from cart sidebar
  - User completes an order
  - Browser session ends or page is closed

## Browser Compatibility

- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile, tablet, and desktop
- Smooth animations and transitions
- Dark mode support using CSS media queries

## User Experience Improvements

1. **No Form Submission Required**: Items are added immediately via checkboxes
2. **Visual Feedback**: Cart count badge shows number of items
3. **Quick Preview**: Sidebar shows all items at a glance
4. **Easy Modification**: Adjust quantities or remove items without leaving the menu
5. **Mobile Friendly**: Full-height sidebar optimized for touch input
6. **Accessibility**: Proper ARIA labels and semantic HTML

## Testing the Feature

### Test Case 1: Add Same Item with Different Variations
1. Go to menu page
2. Find a burger with variation options (e.g., Cheese option)
3. Select "With Cheese", set qty to 1, check box → Item added
4. Find same burger again, select "No Cheese", set qty to 1, check box
5. Open cart → Should see 2 separate burger entries

### Test Case 2: Modify Quantities in Cart
1. Add any item to cart
2. Open cart sidebar
3. Click + button → Quantity increases
4. Click - button → Quantity decreases

### Test Case 3: Remove Items from Cart
1. Add items to cart
2. Open cart sidebar
3. Click trash icon → Item removed
4. Verify total price updates

### Test Case 4: Clear Cart
1. Add multiple items
2. Open cart sidebar
3. Click "Clear Cart" button
4. Confirm dialog → All items removed

## Performance Considerations

- Lightweight component (~300 lines)
- Minimal DOM manipulation
- Efficient event delegation
- sessionStorage operations are instant
- No external dependencies required

## Future Enhancements

Potential improvements for future versions:
1. Edit variations for existing cart items
2. Save cart to favorites
3. Quantity discounts
4. Cart estimated delivery time
5. Recommended items based on cart
6. Coupon code application in cart
7. Special instructions per item in cart

## Troubleshooting

### Cart not updating count
- Clear sessionStorage and refresh page
- Check browser console for errors
- Ensure JavaScript is enabled

### Variations not saving correctly
- Ensure all variation fields have selections if any are selected
- Check that price modifiers are numeric values
- Verify variation names are set in the inventory

### Cart sidebar not opening
- Check if MenuCartComponent was initialized
- Verify cart button click listener is attached
- Look for JavaScript errors in console

## Support

For issues or questions about the shopping cart feature, check:
1. Browser console for error messages
2. Verify all CSS files are loaded (check Network tab)
3. Ensure sessionStorage is not disabled
4. Test in a different browser to rule out browser-specific issues
