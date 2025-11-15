const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

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
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
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
        console.log('Received order data:', req.body);
        const order = new Order(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        logger.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
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
        
        if (!['pending', 'preparing', 'ready', 'complete', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        logger.error('Error updating order status:', error);
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

module.exports = router;
