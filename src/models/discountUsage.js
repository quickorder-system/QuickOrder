const mongoose = require('mongoose');

const discountUsageSchema = new mongoose.Schema({
    discountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
        required: true
    },
    customerId: {
        type: String,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    usedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries
discountUsageSchema.index({ discountId: 1, customerId: 1 });
discountUsageSchema.index({ discountId: 1, orderId: 1 });

const DiscountUsage = mongoose.model('DiscountUsage', discountUsageSchema);

module.exports = DiscountUsage;
