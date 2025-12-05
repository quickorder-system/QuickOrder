const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const Discount = require('../models/discount');
const ActivityLog = require('../models/activityLog');
const logger = require('../utils/logger');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

/**
 * @route GET /api/discounts/validate/:code
 * @description Validate discount code and return discount details
 * @access Public
 */
router.get('/validate/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { orderAmount } = req.query;

        if (!code) {
            throw new BadRequestError('Discount code is required');
        }

        // Find discount - use more flexible date checking
        const now = new Date();
        logger.info(`Validating discount ${code} at ${now.toISOString()}`);
        
        const discount = await Discount.findOne({
            code: code.toUpperCase(),
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (!discount) {
            logger.warn(`Discount ${code} not found or inactive. Searching for debugging info...`);
            // Debug: Find the discount to see what's wrong
            const debugDiscount = await Discount.findOne({
                code: code.toUpperCase()
            });
            
            if (debugDiscount) {
                logger.info(`Debug - Discount found: active=${debugDiscount.isActive}, startDate=${debugDiscount.startDate}, endDate=${debugDiscount.endDate}, now=${now}`);
            }
            
            throw new BadRequestError('Invalid or expired discount code');
        }

        // Check if maximum usage reached
        if (discount.maxTotalUsage && discount.currentUsage >= discount.maxTotalUsage) {
            throw new BadRequestError('This discount code has expired');
        }

        // Check minimum order amount
        if (orderAmount && orderAmount < discount.minOrderAmount) {
            throw new BadRequestError(`Minimum order amount is ₱${discount.minOrderAmount}`);
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.discountType === 'percentage') {
            discountAmount = Math.floor((orderAmount * discount.discountValue) / 100);
        } else {
            discountAmount = discount.discountValue;
        }

        // Check max discount amount
        if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
            discountAmount = discount.maxDiscountAmount;
        }

        res.json({
            message: 'Discount code is valid',
            discount: {
                id: discount._id,
                code: discount.code,
                description: discount.description,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                discountAmount
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/discounts
 * @description Create new discount (Admin/Owner only)
 * @access Private
 */
router.post('/', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount = 0,
            maxDiscountAmount,
            maxUsagePerCustomer,
            maxTotalUsage,
            startDate,
            endDate,
            applicableCategories = []
        } = req.body;

        // Validate input
        if (!code || !discountType || discountValue === undefined) {
            throw new BadRequestError('Code, discount type, and value are required');
        }

        if (!['percentage', 'fixed'].includes(discountType)) {
            throw new BadRequestError('Discount type must be percentage or fixed');
        }

        if (discountValue <= 0) {
            throw new BadRequestError('Discount value must be greater than 0');
        }

        if (!startDate || !endDate) {
            throw new BadRequestError('Start and end dates are required');
        }

        if (new Date(endDate) <= new Date(startDate)) {
            throw new BadRequestError('End date must be after start date');
        }

        // Check if code already exists
        const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
        if (existingDiscount) {
            throw new BadRequestError('Discount code already exists');
        }

        // Create discount
        const discount = new Discount({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            maxUsagePerCustomer,
            maxTotalUsage,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            applicableCategories,
            createdBy: req.user.id,
            isActive: true
        });

        await discount.save();

        // Log activity
        await ActivityLog.create({
            userId: req.user.id,
            action: 'CREATE_DISCOUNT',
            resourceType: 'Discount',
            resourceId: discount._id,
            details: `Created discount code: ${code}`
        });

        logger.info(`Discount created: ${code} by ${req.user.id}`);

        res.status(201).json({
            message: 'Discount created successfully',
            discount
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/discounts
 * @description Get all discounts (Admin/Owner only)
 * @access Private
 */
router.get('/', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        const { page = 1, limit = 10, isActive, search } = req.query;

        const filter = {};
        
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        if (search) {
            filter.$or = [
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const discounts = await Discount.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Discount.countDocuments(filter);

        res.json({
            discounts,
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
 * @route PUT /api/discounts/:id
 * @description Update discount (Admin/Owner only)
 * @access Private
 */
router.put('/:id', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            maxUsagePerCustomer,
            maxTotalUsage,
            startDate,
            endDate,
            applicableCategories,
            isActive
        } = req.body;

        const discount = await Discount.findById(id);
        
        if (!discount) {
            throw new BadRequestError('Discount not found');
        }

        // Update fields
        if (description !== undefined) discount.description = description;
        if (discountType !== undefined) discount.discountType = discountType;
        if (discountValue !== undefined) discount.discountValue = discountValue;
        if (minOrderAmount !== undefined) discount.minOrderAmount = minOrderAmount;
        if (maxDiscountAmount !== undefined) discount.maxDiscountAmount = maxDiscountAmount;
        if (maxUsagePerCustomer !== undefined) discount.maxUsagePerCustomer = maxUsagePerCustomer;
        if (maxTotalUsage !== undefined) discount.maxTotalUsage = maxTotalUsage;
        if (startDate !== undefined) {
            discount.startDate = new Date(startDate);
            logger.info(`Updated startDate to ${discount.startDate.toISOString()}`);
        }
        if (endDate !== undefined) {
            discount.endDate = new Date(endDate);
            logger.info(`Updated endDate to ${discount.endDate.toISOString()}`);
        }
        if (applicableCategories !== undefined) discount.applicableCategories = applicableCategories;
        if (isActive !== undefined) {
            discount.isActive = isActive;
            logger.info(`Updated isActive to ${discount.isActive}`);
        }

        discount.updatedAt = new Date();
        await discount.save();

        // Log activity
        await ActivityLog.create({
            userId: req.user.id,
            action: 'UPDATE_DISCOUNT',
            resourceType: 'Discount',
            resourceId: discount._id,
            details: `Updated discount code: ${discount.code}`
        });

        logger.info(`Discount updated: ${discount.code} by ${req.user.id}`);

        res.json({
            message: 'Discount updated successfully',
            discount
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/discounts/:id
 * @description Delete discount (Admin/Owner only)
 * @access Private
 */
router.delete('/:id', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        const { id } = req.params;

        const discount = await Discount.findByIdAndDelete(id);
        
        if (!discount) {
            throw new BadRequestError('Discount not found');
        }

        // Log activity
        await ActivityLog.create({
            userId: req.user.id,
            action: 'DELETE_DISCOUNT',
            resourceType: 'Discount',
            resourceId: id,
            details: `Deleted discount code: ${discount.code}`
        });

        logger.info(`Discount deleted: ${discount.code} by ${req.user.id}`);

        res.json({ message: 'Discount deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
