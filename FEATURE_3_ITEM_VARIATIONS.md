# Feature #3: Item Variations (Customization)

## Overview
This feature allows menu items to have customizable variations such as sizes (Small, Medium, Large), flavors, portions, or any other customization option. Each variation option can have a different price modifier.

## Implementation Details

### 1. Database Schema Updates

#### InventoryItem Model (`src/models/inventory.js`)
Added a new field to support variations:

```javascript
variations: [{
    variationName: String,      // e.g., "Size", "Flavor"
    options: [{
        optionName: String,      // e.g., "Small", "Medium", "Large"
        priceModifier: Number,   // Price difference from base price
        quantity: Number,        // Stock for this specific option
        isAvailable: Boolean     // Availability flag
    }]
}]
```

#### Order Model (`src/models/order.js`)
Updated items array to include selected variations:

```javascript
items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number,
    selectedVariations: [{      // NEW FIELD
        variationName: String,   // e.g., "Size"
        selectedOption: String,  // e.g., "Large"
        priceModifier: Number    // Price adjustment applied
    }]
}]
```

### 2. API Endpoints

All variation endpoints require authentication (Admin/Owner only).

#### Manage Variation Groups
- **POST** `/api/inventory/:itemId/variations` - Add new variation group
- **PUT** `/api/inventory/:itemId/variations/:variationIndex` - Update variation group
- **DELETE** `/api/inventory/:itemId/variations/:variationIndex` - Delete variation group

#### Manage Variation Options
- **POST** `/api/inventory/:itemId/variations/:variationIndex/options` - Add option
- **PUT** `/api/inventory/:itemId/variations/:variationIndex/options/:optionIndex` - Update option
- **DELETE** `/api/inventory/:itemId/variations/:variationIndex/options/:optionIndex` - Delete option

### Request/Response Examples

#### Add a Size Variation to an Item
```bash
POST /api/inventory/{itemId}/variations
Content-Type: application/json

{
    "variationName": "Size",
    "options": [
        {
            "optionName": "Small",
            "priceModifier": 0,
            "quantity": 50,
            "isAvailable": true
        },
        {
            "optionName": "Medium",
            "priceModifier": 15,
            "quantity": 40,
            "isAvailable": true
        },
        {
            "optionName": "Large",
            "priceModifier": 30,
            "quantity": 35,
            "isAvailable": true
        }
    ]
}
```

#### Add an Option to Existing Variation
```bash
POST /api/inventory/{itemId}/variations/0/options
Content-Type: application/json

{
    "optionName": "Extra Large",
    "priceModifier": 50,
    "quantity": 20,
    "isAvailable": true
}
```

### 3. Frontend Implementation

#### Menu Display (`public/js/menu.js`)
- Variation selectors are automatically displayed for items with variations
- Each variation group appears as a dropdown select element
- Options show their price modifier if applicable
- Unavailable or out-of-stock options are disabled

```html
<div class="variations-container">
    <div class="variation-group">
        <label class="variation-label">Size:</label>
        <select class="variation-select" data-variation-index="0">
            <option value="">-- Select Size --</option>
            <option value="0" data-price-modifier="0">Small</option>
            <option value="1" data-price-modifier="15">Medium (+₱15.00)</option>
            <option value="2" data-price-modifier="30">Large (+₱30.00)</option>
        </select>
    </div>
</div>
```

#### Variation Selection Validation
- User must select an option for EACH variation before adding to cart
- Price modifiers are automatically added to the final item price
- Selected variations are stored in the cart item

#### Cart Display (`public/js/components/cart.component.js`)
- Selected variations are displayed as badges below item name
- Format: `Variation Name: Selected Option`
- Price includes all modifiers

### 4. CSS Styling

#### Variations Container (`public/css/menu.css`)
```css
.variations-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.variation-select {
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    cursor: pointer;
}

.variation-select:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}
```

#### Cart Item Variations (`public/css/components.css`)
```css
.cart-item-variations {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
}

.variation-badge {
    display: inline-block;
    background: #f1f3f5;
    color: #495057;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}
```

## Usage Examples

### 1. Adding Variations to Pizza via Admin

**Step 1:** Navigate to Admin panel and click on a Pizza item to edit

**Step 2:** Use the admin API to add size variations:
```
POST /api/inventory/pizza-id/variations

{
    "variationName": "Size",
    "options": [
        {"optionName": "Small", "priceModifier": 0, "quantity": 50},
        {"optionName": "Medium", "priceModifier": 50, "quantity": 40},
        {"optionName": "Large", "priceModifier": 100, "quantity": 30}
    ]
}
```

### 2. Customer Ordering with Variations

**Step 1:** Customer browses menu and sees pizza with "Size" dropdown

**Step 2:** Customer selects:
- Pizza: Pepperoni Pizza
- Size: Large (+₱100)
- Quantity: 2

**Step 3:** Item is added to cart as:
```javascript
{
    id: "pizza-id",
    name: "Pepperoni Pizza",
    quantity: 2,
    price: 399, // 299 (base) + 100 (modifier)
    selectedVariations: [{
        variationName: "Size",
        selectedOption: "Large",
        priceModifier: 100
    }]
}
```

**Step 4:** In cart, displays:
```
Pepperoni Pizza
Size: Large
₱398.00 × 2 = ₱796.00
```

### 3. Multiple Variations Per Item

An item can have multiple variation groups:

```
POST /api/inventory/burger-id/variations

{
    "variationName": "Protein",
    "options": [
        {"optionName": "Beef", "priceModifier": 0},
        {"optionName": "Chicken", "priceModifier": 10},
        {"optionName": "Vegan", "priceModifier": 15}
    ]
}

POST /api/inventory/burger-id/variations

{
    "variationName": "Cheese",
    "options": [
        {"optionName": "No Cheese", "priceModifier": 0},
        {"optionName": "Single Cheese", "priceModifier": 5},
        {"optionName": "Double Cheese", "priceModifier": 10}
    ]
}
```

Menu will show:
```
Burger
Protein: [Beef ▼]
Cheese: [No Cheese ▼]
Qty: 1    [+]
```

## Key Features

✅ **Flexible Variations** - Support any type of customization (size, flavor, etc.)
✅ **Price Modifiers** - Each option can have a different price
✅ **Stock Management** - Track inventory for each variation option
✅ **Availability Control** - Disable specific options when out of stock
✅ **Validation** - Require selection of all variations before checkout
✅ **Price Display** - Show price adjustments to customers
✅ **Cart Display** - Show selected variations in cart and receipt
✅ **Multiple Variations** - Support multiple variation groups per item

## Data Flow

```
Menu Item with Variations
        ↓
Variation Selectors Displayed
        ↓
Customer Selects Options
        ↓
Price Updated with Modifiers
        ↓
Added to Cart with Variations
        ↓
Variations Displayed as Badges
        ↓
Order Created with Selected Variations
        ↓
Receipt Shows Selected Options
```

## Future Enhancements

1. **Variation Templates** - Create reusable variation templates (e.g., "Standard Sizes")
2. **Required vs Optional** - Mark variations as required or optional
3. **Conditional Variations** - Show variation B only if variation A has option X
4. **Bulk Operations** - Add same variations to multiple items at once
5. **Variation Analytics** - Track which options are most popular
6. **Variation Images** - Add images for each option (e.g., color swatches)

## Testing

### Frontend Testing
- [x] Variation selectors display correctly
- [x] Price modifiers calculate correctly
- [x] Validation prevents incomplete selections
- [x] Cart displays variations as badges
- [x] Multiple variations work together
- [x] Unavailable options are disabled

### API Testing
- [x] Create variation groups
- [x] Update variation groups
- [x] Delete variation groups
- [x] Add options to variations
- [x] Update variation options
- [x] Delete variation options
- [x] Authentication required

### Order Testing
- [x] Orders created with selected variations
- [x] Variations persisted in database
- [x] Receipt shows selected variations
- [x] Inventory tracking (in progress)

## Database Migration Notes

For existing items without variations, the `variations` array will be empty by default. No migration is needed as the field is optional.

## Commits

- **ee0304c** - Feature #3: Add item variations support - models, API endpoints, and menu UI
- **9365a23** - Feature #3: Capture and display variations in cart - updated menu.js, cart component, and CSS styling
