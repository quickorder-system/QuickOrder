const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Discount = require('../models/discount');
const DiscountUsage = require('../models/discountUsage');
const ActivityLog = require('../models/activityLog');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');
const emailService = require('../services/email.service');

// Track recent status updates to prevent duplicate emails
const recentUpdates = new Map();

// Middleware to log request details
router.use((req, res, next) => {
    console.log(`[Order Route] Time: ${Date.now()}, Method: ${req.method}, URL: ${req.originalUrl}`);
    console.log('[Order Route] Request Body:', req.body);
    next();
});

const { validateOrder } = require('../middleware/validation');

/**
 * @route GET /api/orders
 * @description Get all orders
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        logger.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

/**
 * @route GET /api/orders/:id
 * @description Get a single order by ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const mongoose = require('mongoose');
        let order = null;
        
        // Check if the id is a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            try {
                order = await Order.findById(id);
            } catch (err) {
                // If findById fails (e.g., cast error), continue to next search
                console.log(`[Orders GET] findById failed for ${id}, trying orderId search`);
            }
        }
        
        // If not found by _id, try to find by orderId (formatted ID like QO000002)
        if (!order) {
            order = await Order.findOne({ orderId: id });
        }
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        console.log(`[Orders GET] Retrieved order ${req.params.id}. Current paymentStatus: ${order.paymentStatus}`);
        
        // Ensure paymentStatus is set (for backwards compatibility with old orders)
        if (!order.paymentStatus) {
            console.log(`[Orders GET] paymentStatus is missing, setting to 'pending'`);
            order.paymentStatus = 'pending';
            order = await order.save();
        }
        
        console.log(`[Orders GET] Final paymentStatus: ${order.paymentStatus}`);
        res.json(order);
    } catch (error) {
        logger.error('Error fetching order:', error);
        res.status(500).json({ message: 'Error fetching order' });
    }
});

/**
 * @route POST /api/orders
 * @description Create a new order
 * @access Private
 */
router.post('/', /*validateOrder,*/ async (req, res) => {
    try {
        console.log('[Orders POST] Received order data:', req.body);

        // Validate required fields
        const requiredFields = ['customerName', 'customerPhone', 'email', 'address', 'paymentMethod', 'subtotal', 'total', 'items'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            console.error('[Orders POST] Missing required fields:', missingFields);
            return res.status(400).json({ 
                message: 'Missing required fields',
                missingFields: missingFields
            });
        }

        // Validate items array
        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            console.error('[Orders POST] Items array is invalid or empty');
            return res.status(400).json({ 
                message: 'Order must contain at least one item'
            });
        }

        // Validate numeric fields
        if (isNaN(req.body.subtotal) || isNaN(req.body.total)) {
            console.error('[Orders POST] Invalid subtotal or total values');
            return res.status(400).json({ 
                message: 'Subtotal and total must be valid numbers'
            });
        }

        console.log('[Orders POST] Validation passed, creating order...');

        const order = new Order(req.body);
        await order.save();

        console.log('[Orders POST] Order created successfully:', order._id);

        // Track discount usage if a discount was applied
        if (order.discount && order.discount.discountId && order.customerId) {
            try {
                // Create discount usage record
                await DiscountUsage.create({
                    discountId: order.discount.discountId,
                    customerId: order.customerId,
                    orderId: order._id
                });

                // Increment discount usage count
                await Discount.updateOne(
                    { _id: order.discount.discountId },
                    { $inc: { currentUsage: 1 } }
                );

                console.log('[Orders POST] Discount usage tracked for discount:', order.discount.discountId);
            } catch (error) {
                // Log error but don't fail the order creation
                console.error('[Orders POST] Error tracking discount usage:', error);
                logger.error('Error tracking discount usage:', error);
            }
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('[Orders POST] Error creating order:', error.message);
        console.error('[Orders POST] Error details:', error);
        
        logger.error('Error creating order:', error);
        
        res.status(500).json({ 
            message: 'Error creating order',
            error: error.message
        });
    }
});

/**
 * @route PUT /api/orders/:id/status
 * @description Update the status of an order
 * @access Private
 */
router.put('/:id/status', auth, async (req, res) => { // Temporarily commented out auth
    try {
        const { id } = req.params;
        const { status } = req.body;
        const mongoose = require('mongoose');
        
        console.log(`[Orders] Updating order ${id} status to ${status}`);
        
        if (!['pending', 'preparing', 'ready', 'complete', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Get the current order - check if valid ObjectId first
        let order = null;
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            try {
                order = await Order.findById(id);
            } catch (err) {
                console.log(`[Orders PUT] findById failed for ${id}, trying orderId search`);
            }
        }
        
        // If not found by _id, try to find by orderId
        if (!order) {
            order = await Order.findOne({ orderId: id });
        }
        
        if (!order) {
            console.log(`[Orders] Order not found: ${id}`);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the status
        order.status = status;
        
        // Determine paymentStatus based on the new order status
        if (status === 'preparing') {
            // When order is marked as preparing, payment is verified
            order.paymentStatus = 'verified';
            console.log(`[Orders] Setting paymentStatus to 'verified'`);
        } else if (status === 'cancelled') {
            // When order is cancelled, payment is rejected
            order.paymentStatus = 'rejected';
            console.log(`[Orders] Setting paymentStatus to 'rejected'`);
        }

        console.log(`[Orders] Before save - Status: ${order.status}, PaymentStatus: ${order.paymentStatus}`);
        
        // Save the order
        await order.save();
        
        console.log(`[Orders] Order saved successfully. Status: ${order.status}, PaymentStatus: ${order.paymentStatus}`);
        
        // Send email notifications based on status (with deduplication)
        const updateKey = `${id}_${status}`;
        const lastUpdate = recentUpdates.get(updateKey);
        const now = Date.now();
        
        // Only send email if this update hasn't been processed in the last 2 seconds
        if (!lastUpdate || (now - lastUpdate) > 2000) {
            recentUpdates.set(updateKey, now);
            
            try {
                if (status === 'preparing') {
                    await emailService.sendPreparingEmail(order);
                } else if (status === 'ready') {
                    await emailService.sendReadyEmail(order);
                } else if (status === 'complete') {
                    await emailService.sendCompletedEmail(order);
                } else if (status === 'cancelled') {
                    await emailService.sendCancelledEmail(order);
                }
            } catch (emailError) {
                logger.error('Email notification error:', emailError.message);
                // Don't fail the request if email fails
            }
        } else {
            console.log(`[Orders] Duplicate status update detected, skipping email`);
        }
        
        // Log activity
        try {
            await ActivityLog.create({
                userId: req.user?.id || 'system',
                username: req.user?.name || 'System',
                action: 'UPDATE_ORDER_STATUS',
                page: req.user?.role === 'owner' ? 'OWNER' : 'ADMIN',
                description: `Updated order ${order.orderId} status from ${order.status} to ${status}`,
                details: {
                    orderId: order.orderId,
                    previousStatus: order.status,
                    newStatus: status,
                    customerName: order.customerName,
                    paymentStatus: order.paymentStatus
                },
                ipAddress: req.ip
            });
        } catch (logError) {
            logger.warn('Failed to log activity:', logError.message);
        }
        
        res.json(order);
    } catch (error) {
        logger.error('Error updating order status:', error);
        console.error(`[Orders] Error updating order status:`, error);
        res.status(500).json({ message: 'Error updating order status' });
    }
});


/**
 * @route DELETE /api/orders/:id
 * @description Delete an order
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => { // Temporarily commented out auth
    try {
        const result = await Order.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order deleted', id: req.params.id });
    } catch (error) {
        logger.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order' });
    }
});

/**
 * @route PATCH /api/orders/:id/payment-status
 * @description Update the payment status of an order (admin/owner only)
 * @access Private
 */
router.patch('/:id/payment-status', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        const mongoose = require('mongoose');

        console.log(`[Orders] Updating order ${id} payment status to ${paymentStatus}`);

        // Validate payment status
        if (!['pending', 'verified', 'rejected'].includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        // Get the current order - check if valid ObjectId first
        let order = null;
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            try {
                order = await Order.findById(id);
            } catch (err) {
                console.log(`[Orders PATCH] findById failed for ${id}, trying orderId search`);
            }
        }
        
        // If not found by _id, try to find by orderId
        if (!order) {
            order = await Order.findOne({ orderId: id });
        }
        
        if (!order) {
            console.log(`[Orders] Order not found: ${id}`);
            return res.status(404).json({ message: 'Order not found' });
        }

        const previousPaymentStatus = order.paymentStatus;

        // Update the payment status
        order.paymentStatus = paymentStatus;

        console.log(`[Orders] Updating payment status to ${paymentStatus}`);

        // Save the order
        await order.save();

        console.log(`[Orders] Payment status updated successfully. OrderId: ${order.orderId}, PaymentStatus: ${order.paymentStatus}`);
        
        // Send email notification if payment status changed (with deduplication)
        const updateKey = `${id}_payment_${paymentStatus}`;
        const lastUpdate = recentUpdates.get(updateKey);
        const now = Date.now();
        
        // Only send email if this update hasn't been processed in the last 2 seconds
        if (!lastUpdate || (now - lastUpdate) > 2000) {
            recentUpdates.set(updateKey, now);
            
            try {
                if (previousPaymentStatus !== paymentStatus) {
                    await emailService.sendPaymentStatusEmail(order, paymentStatus);
                }
            } catch (emailError) {
                logger.error('Email notification error:', emailError.message);
                // Don't fail the request if email fails
            }
        } else {
            console.log(`[Orders] Duplicate payment status update detected, skipping email`);
        }
        
        res.json(order);
    } catch (error) {
        logger.error('Error updating payment status:', error);
        console.error(`[Orders] Error updating payment status:`, error);
        res.status(500).json({ message: 'Error updating payment status' });
    }
});

module.exports = router;
