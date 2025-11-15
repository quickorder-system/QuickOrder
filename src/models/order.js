const mongoose = require('mongoose');
const { generateOrderId } = require('../utils/order');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentScreenshot: {
        type: String,
        required: true
    },
    specialInstructions: {
        type: String
    },
    items: [{
        itemId: {
            type: Number,
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
        }
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
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
