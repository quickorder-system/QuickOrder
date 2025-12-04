# Shopping Cart Module - Quick Start Guide

## What's New? 🎉

The **Shopping Cart** is now integrated directly into the Menu page! This means you can:
- ✅ Add items to your cart while browsing the menu
- ✅ Select different variations for the SAME item
- ✅ Manage your entire order without leaving the menu
- ✅ See your total price in real-time

## Getting Started

### Step 1: Browse the Menu
Open the Menu page and explore the available items. Each item shows:
- **Item Name** and **Price**
- **Description**
- **Variations** (if available)
- **Quantity Selector**
- **Add to Cart Checkbox**

### Step 2: Choose Your Item with Variations

If the item has variations (like Cheese, Size, Add-ons), you MUST select all required options:

```
Example: Burger
├─ Cheese: (Select one)
│  ○ No Cheese
│  ○ With Cheese (+₱20)
│  ○ Extra Cheese (+₱35)
└─ Size: (Select one)
   ○ Regular
   ○ Large (+₱30)
   ○ Extra Large (+₱50)
```

### Step 3: Set Quantity

Use the quantity input field to set how many items you want:
- Minimum: 1
- Maximum: 10 (or as configured)

### Step 4: Add to Cart

Check the checkbox to add the item to your shopping cart. The item will appear immediately in your cart sidebar with:
- ✓ Item name
- ✓ Selected variations
- ✓ Unit price (including variation costs)
- ✓ Quantity

### Step 5: View Your Cart

Click the **"View Cart"** button (bottom-right of screen) to open your shopping cart sidebar. Here you can:
- See all items you've added
- View total price
- Adjust quantities
- Remove items
- Clear the entire cart
- Proceed to checkout

## How to Order the Same Item with Different Variations

### Example: 2 Burgers with Different Preferences

**Burger #1:**
1. Find the Burger item
2. Select: Cheese = "With Cheese"
3. Select: Size = "Large"
4. Set Qty: 1
5. Check the checkbox ✓
   → Burger (Large, With Cheese) added to cart

**Burger #2:**
1. Find the same Burger item again
2. Select: Cheese = "No Cheese"
3. Select: Size = "Regular"
4. Set Qty: 1
5. Check the checkbox ✓
   → Burger (Regular, No Cheese) added to cart

**Result in Cart:**
```
Shopping Cart
├── Burger
│   Cheese: With Cheese
│   Size: Large
│   ₱200.00  [−] 1 [+] [🗑]
│
├── Burger
│   Cheese: No Cheese
│   Size: Regular
│   ₱150.00  [−] 1 [+] [🗑]
│
Total: ₱350.00
```

## Cart Controls Explained

### View Cart Button
- **Location**: Bottom-right corner of menu
- **Badge**: Shows number of items in cart
- **Function**: Opens the shopping cart sidebar

### Cart Sidebar

#### Header
- **Title**: "Shopping Cart"
- **Close Button**: Click to hide the sidebar (keeps items)

#### Body
Shows each item with:
- **Item Name**
- **Selected Variations** (if any)
- **Unit Price**
- **Quantity Controls**
  - **[−]** button: Decrease quantity
  - **Number**: Current quantity
  - **[+]** button: Increase quantity
- **Remove Button [🗑]**: Delete this item from cart

#### Footer
- **Total**: Your current cart total
- **Clear Cart**: Remove all items (with confirmation)
- **Proceed to Checkout**: Go to payment page

## Tips & Tricks

### 💡 Variation Tips
- If an item has variations, you MUST select ALL of them
- Variations can add or subtract from the base price
- Check the price next to each option: "+₱20" means it costs extra

### 💡 Quantity Tips
- Change quantity in the cart with +/− buttons
- No need to add the same item multiple times with same variations
- Use quantity counter instead

### 💡 Mobile Tips
- Swipe from right edge to close cart
- Use large touch targets for easier tapping
- Cart sidebar full-height on mobile for easy viewing

### 💡 Price Tips
- Base price shown for each item
- Final price = Base Price + Variation Costs
- Total at bottom includes all items and their variations

## Common Tasks

### Add Item to Cart
1. Select variations (if needed)
2. Set quantity
3. Check the checkbox
4. ✓ Item appears in cart

### Remove Item from Cart
1. Click the View Cart button
2. Find the item
3. Click the trash icon [🗑]
4. ✓ Item removed

### Change Item Quantity
1. Click the View Cart button
2. Use [−] or [+] buttons to adjust
3. ✓ Quantity and total update automatically

### Clear Entire Cart
1. Click the View Cart button
2. Click "Clear Cart" button
3. Confirm in the dialog
4. ✓ All items removed

### Proceed to Checkout
1. Click the View Cart button
2. Review your items and total
3. Click "Proceed to Checkout"
4. ✓ Go to payment page

## What Happens to My Cart?

### Cart is Saved
- Your cart is saved in your browser's session storage
- If you refresh the page, your cart items remain
- Cart survives navigation between pages (during same session)

### Cart is Cleared
- When you complete an order
- When you close the browser
- When you click "Clear Cart" button
- When the session expires

## Price Calculation

Each item's final price is calculated as:
```
Final Price = Base Price + Sum of All Variation Prices
```

**Example:**
```
Burger Base Price: ₱150

You select:
- Cheese: With Cheese (+₱20)
- Size: Large (+₱30)
- Add Bacon (+₱25)

Final Price = ₱150 + ₱20 + ₱30 + ₱25 = ₱225
```

## Mobile Experience

The cart is optimized for mobile phones:
- **Full-height sidebar** for easy scrolling
- **Large buttons** for touch input
- **Responsive design** that adapts to screen size
- **Smooth animations** for better user experience

## Troubleshooting

### Q: Checkbox is disabled, can't add item?
**A:** The item might be out of stock. Check for "Out of Stock" or "Unavailable" badge on the item card.

### Q: Error: "Please select all options"?
**A:** If the item has variations, you must select ALL of them before adding to cart. Don't leave any dropdown empty.

### Q: Cart items disappeared after refresh?
**A:** Cart is temporary (session-based). Complete your order before closing the browser. Session storage clears when browser closes.

### Q: Price doesn't match?
**A:** The price shown includes variation modifiers. Verify all selected variations and their prices. Each variation might add a surcharge.

### Q: Can't find "Add to Cart" option?
**A:** Make sure you have JavaScript enabled in your browser. The cart system requires JavaScript to function.

### Q: Cart sidebar won't open?
**A:** Try refreshing the page. If it still doesn't work, check browser console for errors.

## Keyboard Shortcuts

- **Tab**: Navigate between items and buttons
- **Enter**: Activate checkbox or button
- **Space**: Toggle checkbox
- **Esc**: Close cart sidebar (in some browsers)

## Browser Support

The shopping cart works on:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Performance

The shopping cart is:
- **Lightweight**: Loads instantly
- **Fast**: Updates in real-time
- **Responsive**: Works smoothly on all devices
- **Persistent**: Cart data saved locally

## Next Steps

1. **Add items**: Select items with your preferred variations
2. **Review cart**: Check items and total in cart sidebar
3. **Adjust as needed**: Change quantities or remove items
4. **Checkout**: Click "Proceed to Checkout" when ready

---

**Enjoy ordering! Questions? Contact support or check the detailed documentation.**

---

## For Developers

For technical details about the shopping cart implementation, see:
- `CART_IMPLEMENTATION_SUMMARY.md` - Technical changes and architecture
- `CART_MODULE_GUIDE.md` - Detailed feature documentation
- `CART_VISUAL_WORKFLOW.md` - Visual diagrams and workflows
