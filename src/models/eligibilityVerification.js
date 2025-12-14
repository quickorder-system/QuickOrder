const mongoose = require('mongoose');

const eligibilityVerificationSchema = new mongoose.Schema({
    // Reference to the customer
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Discount being used
    discountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
        required: true
    },
    
    // Type of eligibility
    type: {
        type: String,
        enum: ['SC', 'PWD'],
        required: true
    },
    
    // Order where this discount was applied
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    
    // Discount amount applied
    discountAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Verification method
    verificationMethod: {
        type: String,
        enum: ['manual', 'auto', 'document'],
        default: 'auto'
    },
    
    // URL to uploaded ID document proof
    documentProof: {
        type: String,
        default: null
    },
    
    // Verification status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    
    // Admin who verified (if applicable)
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // When the verification was completed
    verifiedAt: {
        type: Date,
        default: null
    },
    
    // Rejection reason (if applicable)
    rejectionReason: {
        type: String,
        default: null
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
eligibilityVerificationSchema.index({ userId: 1, createdAt: -1 });
eligibilityVerificationSchema.index({ type: 1, status: 1 });
eligibilityVerificationSchema.index({ orderId: 1 });
eligibilityVerificationSchema.index({ discountId: 1 });

const EligibilityVerification = mongoose.model('EligibilityVerification', eligibilityVerificationSchema);

module.exports = EligibilityVerification;
