const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Order = require('../models/order');
const logger = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');

/**
 * @route GET /api/customers/profile
 * @description Get customer profile
 * @access Private
 */
router.get('/profile', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password -emailVerificationToken -passwordResetToken');
        
        if (!user) {
            throw new BadRequestError('User not found');
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/customers/profile
 * @description Update customer profile
 * @access Private
 */
router.put('/profile', auth, async (req, res, next) => {
    try {
        const { name, address, preferences } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Update allowed fields
        if (name) user.name = name;
        
        if (address) {
            user.address = {
                street: address.street || user.address?.street || '',
                city: address.city || user.address?.city || '',
                postalCode: address.postalCode || user.address?.postalCode || '',
                phone: address.phone || user.address?.phone || ''
            };
        }

        if (preferences) {
            user.preferences = {
                notifications: preferences.notifications !== undefined ? preferences.notifications : user.preferences?.notifications || true,
                smsNotifications: preferences.smsNotifications !== undefined ? preferences.smsNotifications : user.preferences?.smsNotifications || false
            };
        }

        user.updatedAt = new Date();
        await user.save();

        logger.info(`Customer profile updated: ${user.email}`);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                address: user.address,
                preferences: user.preferences
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/customers/orders
 * @description Get customer's order history
 * @access Private
 */
router.get('/orders', auth, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        
        // Build filter
        const filter = { customerId: req.user.id };
        if (status) {
            filter.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Get orders
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('items.itemId', 'name price')
            .lean();

        // Get total count
        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/customers/orders/:orderId
 * @description Get specific order details
 * @access Private
 */
router.get('/orders/:orderId', auth, async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user.id
        }).populate('items.itemId', 'name price description');

        if (!order) {
            throw new BadRequestError('Order not found');
        }

        res.json(order);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
