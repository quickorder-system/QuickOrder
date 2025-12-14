const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null
    },
    maxUsagePerCustomer: {
        type: Number,
        default: null,
        min: 1
    },
    maxTotalUsage: {
        type: Number,
        default: null,
        min: 1
    },
    currentUsage: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    applicableCategories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }
    ],
    // Eligibility-based discount fields (for SC/PWD)
    isEligibilityBased: {
        type: Boolean,
        default: false
    },
    eligibilityType: {
        type: String,
        enum: ['SC', 'PWD', 'general', null],
        default: null
    },
    requiresVerification: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Index for active discounts and date range queries
discountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
discountSchema.index({ code: 1, isActive: 1 });

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
