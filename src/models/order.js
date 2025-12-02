const mongoose = require('mongoose');
const { generateOrderId } = require('../utils/order');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        index: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    deliveryType: {
        type: String,
        enum: ['pickup', 'delivery'],
        default: 'pickup'
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentScreenshot: {
        type: String,
        required: false  // Changed to not required for Cash payments
    },
    specialInstructions: {
        type: String
    },
    items: [{
        itemId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        // New field: Store selected variations
        selectedVariations: [{
            variationName: {
                type: String
                // e.g., "Size"
            },
            selectedOption: {
                type: String
                // e.g., "Medium"
            },
            priceModifier: {
                type: Number,
                default: 0
            }
        }]
    }],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'preparing', 'ready', 'complete', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            // Ensure paymentStatus is always included, default to 'pending' if missing
            if (!ret.paymentStatus) {
                ret.paymentStatus = 'pending';
            }
            return ret;
        }
    }
});

// Pre-save middleware to generate orderId
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    this.orderId = await generateOrderId();
  }
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
