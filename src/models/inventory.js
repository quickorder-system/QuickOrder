const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        default: 'pcs'
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    alertLevel: {
        type: Number,
        default: 0,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    // New field: Variations (e.g., sizes, flavors, etc.)
    variations: [{
        variationName: {
            type: String,
            required: true,
            trim: true
            // e.g., "Size", "Flavor", "Portion"
        },
        options: [{
            optionName: {
                type: String,
                required: true,
                trim: true
                // e.g., "Small", "Medium", "Large"
            },
            priceModifier: {
                type: Number,
                default: 0
                // Price difference from base price (can be negative)
            },
            quantity: {
                type: Number,
                default: 0
                // Stock level for this specific variation
            },
            isAvailable: {
                type: Boolean,
                default: true
            }
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
