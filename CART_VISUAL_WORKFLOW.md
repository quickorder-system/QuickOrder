# Shopping Cart Module - Visual Workflow

## User Interface Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MENU PAGE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Menu Items                          Floating Cart Button        │
│  ┌──────────────────┐                      ┌─────────┐           │
│  │ 🍔 Burger        │                      │ 🛒 View │           │
│  │ Price: ₱150      │                      │  Cart   │ [2]       │
│  │                  │                      └─────────┘           │
│  │ Variations:      │                                            │
│  │ ├─ Cheese: □     │                                            │
│  │ │  ○ With Cheese │                                            │
│  │ │  ○ No Cheese   │                                            │
│  │ └─ Size: □       │                                            │
│  │    ○ Regular     │                                            │
│  │    ○ Large       │                                            │
│  │                  │                                            │
│  │ Qty: [1]         │                                            │
│  │ [☑] Add to Cart  │                                            │
│  └──────────────────┘                                            │
│                                                                   │
│  ... (Other menu items)                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Cart Sidebar Modal

```
┌──────────────────────────────────────────┐
│  Shopping Cart                      [✕]  │  ← Close button
├──────────────────────────────────────────┤
│                                          │
│  Cart Items:                             │
│  ┌────────────────────────────────────┐  │
│  │ 🍔 Burger                          │  │
│  │ Cheese: With Cheese               │  │
│  │ Size: Regular                     │  │
│  │ ₱170.00                [−] 1 [+] [✓] │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 🍔 Burger                          │  │
│  │ Cheese: No Cheese                 │  │
│  │ Size: Large                       │  │
│  │ ₱150.00                [−] 1 [+] [✓] │
│  └────────────────────────────────────┘  │
│                                          │
├──────────────────────────────────────────┤
│ Total: ₱320.00                           │
├──────────────────────────────────────────┤
│  [Clear Cart]  [Proceed to Checkout]     │
└──────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERACTION                       │
├─────────────────────────────────────────────────────────────┤

     1. Select Item Variations
            ↓
     2. Set Quantity
            ↓
     3. Check Checkbox
            ↓
┌────────────────────────────────────────┐
│   handleCheckboxChange() Event Handler │
├────────────────────────────────────────┤
│                                        │
│  • Validate all variations selected    │
│  • Calculate final price with modifiers
│  • Generate unique cart item ID        │
│  • Create cart item object             │
│  • Call stateService.addToCart()       │
│                                        │
└────────────────────┬───────────────────┘
                     ↓
          ┌──────────────────────┐
          │   State Service      │
          │  (sessionStorage)    │
          └──────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │  MenuCartComponent   │
          │  (Subscription)      │
          └──────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │  Cart Sidebar Render │
          │  • Update item list  │
          │  • Update total      │
          │  • Update count      │
          └──────────────────────┘
```

## Cart Item ID Generation

```
Example 1: Burger with different variations

Item: Burger (MongoDB ID: 507f1f77bcf86cd799439011)

CART ENTRY 1:
Variations: Cheese=With Cheese, Size=Large
ID = 507f1f77bcf86cd799439011_With_Cheese_Large
Price = 150 + 20 (cheese) + 0 (size) = ₱170

CART ENTRY 2:
Variations: Cheese=No Cheese, Size=Large  
ID = 507f1f77bcf86cd799439011_No_Cheese_Large
Price = 150 + 0 (no cheese) + 0 (size) = ₱150

CART ENTRY 3:
Variations: Cheese=With Cheese, Size=Regular
ID = 507f1f77bcf86cd799439011_With_Cheese_Regular
Price = 150 + 20 (cheese) + 0 (size) = ₱170

Result: 3 separate cart entries for same item with different variations!
```

## Event Flow - Adding Item to Cart

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User selects variations and checks checkbox               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. 'change' event fired on checkbox                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. handleCheckboxChange() invoked                            │
│    ├─ Get item data from card                               │
│    ├─ Get selected variations                               │
│    ├─ Validate variations (all or none)                     │
│    ├─ Calculate price with modifiers                        │
│    └─ Generate unique cart item ID                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. stateService.addToCart(cartItem)                          │
│    ├─ Add item to state.cart array                          │
│    ├─ Save to sessionStorage                                │
│    └─ Call notifyListeners('cart')                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. MenuCartComponent subscription triggered                  │
│    └─ render() method called                                │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Cart UI Updated                                           │
│    ├─ Item added to cart sidebar                            │
│    ├─ Total price recalculated                              │
│    ├─ Cart count badge updated                              │
│    └─ Variations displayed                                  │
└──────────────────────────────────────────────────────────────┘
```

## Variation Pricing Example

```
Menu Item: Deluxe Burger
Base Price: ₱150

Available Variations:
├─ Cheese
│  ├─ No Cheese .......... +₱0
│  ├─ Single Cheese ...... +₱20
│  └─ Double Cheese ...... +₱35
│
├─ Size
│  ├─ Regular ............ +₱0
│  ├─ Large .............. +₱30
│  └─ Extra Large ........ +₱50
│
└─ Special Add-ons
   ├─ Bacon .............. +₱25
   └─ Extra Patty ........ +₱45


EXAMPLE COMBINATIONS IN CART:

1. Regular + No Cheese + No Add-ons
   Price = 150 + 0 + 0 + 0 = ₱150

2. Large + Single Cheese + Bacon
   Price = 150 + 30 + 20 + 25 = ₱225

3. Extra Large + Double Cheese + Bacon + Extra Patty
   Price = 150 + 50 + 35 + 25 + 45 = ₱305

Each appears as separate cart entry!
```

## Mobile Experience

```
MENU PAGE (Mobile)                  CART SIDEBAR (Mobile)
┌──────────────────┐                ┌──────────────────┐
│ Quick Order  🌙  │                │ Shopping Cart [✕]│
├──────────────────┤                ├──────────────────┤
│ 🔍 Search...     │  Swipe →       │                  │
│ ▼ All Categories │  Open Cart     │ 🍔 Burger        │
├──────────────────┤                │ Cheese: Cheddar  │
│                  │                │ ₱170 [−] 1 [+]  │
│ [Menu Items]     │                │                  │
│                  │                │ 🍕 Pizza         │
│ 🍔 Burger ₱150  │                │ Size: Large      │
│ Variations...    │                │ ₱250 [−] 2 [+]  │
│ Qty: [1]        │                │                  │
│ [☑] Add         │                ├──────────────────┤
│                  │                │ Total: ₱670      │
│ [View Cart] [2]  │                ├──────────────────┤
└──────────────────┘                │ [Clear] [Checkout]
                                    └──────────────────┘
```

## State Management Flow

```
SESSION STORAGE
┌─────────────────────────────────────┐
│ cart: [                             │
│   {                                 │
│     id: "item1_Cheese",            │
│     itemId: "item1",                │
│     name: "Burger",                 │
│     quantity: 1,                    │
│     price: 170,                     │
│     selectedVariations: [...]       │
│   },                                │
│   {                                 │
│     id: "item1_No_Cheese",         │
│     itemId: "item1",                │
│     name: "Burger",                 │
│     quantity: 2,                    │
│     price: 150,                     │
│     selectedVariations: [...]       │
│   }                                 │
│ ]                                   │
└─────────────────────────────────────┘
        ↑                    ↑
        │                    │
   Persisted             Loaded on
   on Update            Page Refresh
```

## Component Hierarchy

```
menu.html
├── navbar
├── menu-items (dynamic)
│   ├── variations-selector
│   ├── quantity-input
│   └── add-to-cart-checkbox
├── floating-cart-button
└── menu-cart-modal (MenuCartComponent)
    ├── cart-overlay
    ├── cart-panel
    │   ├── cart-header
    │   │   └── close-button
    │   ├── cart-body
    │   │   └── cart-items-list
    │   │       └── cart-item (repeating)
    │   │           ├── item-info
    │   │           └── item-controls
    │   └── cart-footer
    │       ├── cart-summary
    │       └── action-buttons
    └── (styles: menu-cart.css)
```

This visual documentation helps developers and users understand how the shopping cart module works!
