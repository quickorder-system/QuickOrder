const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const Discount = require('../models/discount');
const DiscountUsage = require('../models/discountUsage');
const ActivityLog = require('../models/activityLog');
const logger = require('../utils/logger');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

/**
 * @route GET /api/discounts/validate/:code
 * @description Validate discount code and return discount details
 * @access Private (requires authentication)
 */
router.get('/validate/:code', auth, async (req, res, next) => {
    try {
        const { code } = req.params;
        const { orderAmount } = req.query;
        const customerId = req.user.id;

        if (!code) {
            throw new BadRequestError('Discount code is required');
        }

        // Find discount - use more flexible date checking
        // Exclude eligibility-based discounts (SC/PWD) from manual code validation
        const now = new Date();
        logger.info(`Validating discount ${code} at ${now.toISOString()}`);
        
        const discount = await Discount.findOne({
            code: code.toUpperCase(),
            isActive: true,
            isEligibilityBased: { $ne: true },  // Exclude automatic discounts
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

        // Check per-customer usage limit
        if (discount.maxUsagePerCustomer) {
            const customerUsageCount = await DiscountUsage.countDocuments({
                discountId: discount._id,
                customerId: customerId
            });

            if (customerUsageCount >= discount.maxUsagePerCustomer) {
                throw new BadRequestError(`You have already used this discount code ${discount.maxUsagePerCustomer} time(s)`);
            }
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
 * @route POST /api/discounts/setup-eligibility-discounts
 * @description Create default SC and PWD eligibility discounts (Admin only)
 * @access Private
 */
router.post('/setup-eligibility-discounts', [auth, authorize(['admin'])], async (req, res, next) => {
    try {
        const { scPercentage = 20, pwdPercentage = 15, startYear = 2025, endYear = 2026 } = req.body;

        // Set date range for the year
        const startDate = new Date(`${startYear}-01-01`);
        const endDate = new Date(`${endYear}-12-31`);

        // Create SC Discount if it doesn't exist
        const scDiscountCode = `SC-DISCOUNT-${endYear}`;
        let scDiscount = await Discount.findOne({ code: scDiscountCode });

        if (!scDiscount) {
            scDiscount = await Discount.create({
                code: scDiscountCode,
                description: `Senior Citizen Discount - ${scPercentage}% off on all orders`,
                discountType: 'percentage',
                discountValue: scPercentage,
                minOrderAmount: 0,
                maxDiscountAmount: null,
                maxUsagePerCustomer: null,
                maxTotalUsage: null,
                currentUsage: 0,
                isActive: true,
                startDate,
                endDate,
                isEligibilityBased: true,
                eligibilityType: 'SC',
                requiresVerification: false,
                createdBy: req.user.id
            });
            logger.info(`Created SC discount: ${scDiscountCode} by admin: ${req.user.id}`);
        }

        // Create PWD Discount if it doesn't exist
        const pwdDiscountCode = `PWD-DISCOUNT-${endYear}`;
        let pwdDiscount = await Discount.findOne({ code: pwdDiscountCode });

        if (!pwdDiscount) {
            pwdDiscount = await Discount.create({
                code: pwdDiscountCode,
                description: `PWD Discount - ${pwdPercentage}% off on all orders`,
                discountType: 'percentage',
                discountValue: pwdPercentage,
                minOrderAmount: 0,
                maxDiscountAmount: null,
                maxUsagePerCustomer: null,
                maxTotalUsage: null,
                currentUsage: 0,
                isActive: true,
                startDate,
                endDate,
                isEligibilityBased: true,
                eligibilityType: 'PWD',
                requiresVerification: false,
                createdBy: req.user.id
            });
            logger.info(`Created PWD discount: ${pwdDiscountCode} by admin: ${req.user.id}`);
        }

        // Log activity
        await ActivityLog.create({
            userId: req.user.id,
            action: 'CREATE_DISCOUNT',
            resourceType: 'Discount',
            details: `Setup eligibility discounts: SC (${scPercentage}%), PWD (${pwdPercentage}%)`
        });

        res.json({
            message: 'Eligibility discounts created successfully',
            discounts: {
                sc: {
                    id: scDiscount._id,
                    code: scDiscount.code,
                    description: scDiscount.description,
                    discountValue: scDiscount.discountValue
                },
                pwd: {
                    id: pwdDiscount._id,
                    code: pwdDiscount.code,
                    description: pwdDiscount.description,
                    discountValue: pwdDiscount.discountValue
                }
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

/**
 * @route GET /api/discounts/eligible
 * @description Get eligible automatic discounts (SC/PWD) for current customer
 * @access Private (customer only)
 */
router.get('/eligible-discounts', auth, async (req, res, next) => {
    try {
        const User = require('../models/user');
        const user = await User.findById(req.user.id);

        if (!user) {
            throw new BadRequestError('User not found');
        }

        const now = new Date();
        const eligibleDiscounts = [];

        logger.info(`Checking eligible discounts for user ${req.user.id}:`, {
            isPWD: user.customerProfile?.isPWD,
            isSC: user.customerProfile?.isSeniorCitizen,
            pwdVerified: user.customerProfile?.pwdVerified,
            scVerified: user.customerProfile?.scVerified,
            usePWDDiscount: user.discountPreferences?.usePWDDiscount,
            useSCDiscount: user.discountPreferences?.useSCDiscount
        });

        // Check if user is Senior Citizen and preference is enabled
        if (user.customerProfile?.isSeniorCitizen && user.discountPreferences?.useSCDiscount) {
            const scDiscount = await Discount.findOne({
                eligibilityType: 'SC',
                isEligibilityBased: true,
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            });

            logger.info(`SC Discount search result:`, scDiscount ? 'found' : 'not found');

            if (scDiscount) {
                eligibleDiscounts.push({
                    id: scDiscount._id,
                    code: scDiscount.code,
                    description: scDiscount.description,
                    type: 'SC',
                    discountValue: scDiscount.discountValue,
                    discountType: scDiscount.discountType,
                    isVerified: user.customerProfile?.scVerified || false,
                    verificationStatus: user.customerProfile?.scVerified ? 'approved' : 'pending'
                });
            }
        }

        // Check if user is PWD and preference is enabled
        if (user.customerProfile?.isPWD && user.discountPreferences?.usePWDDiscount) {
            const pwdDiscount = await Discount.findOne({
                eligibilityType: 'PWD',
                isEligibilityBased: true,
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            });

            logger.info(`PWD Discount search result:`, pwdDiscount ? 'found' : 'not found');

            if (pwdDiscount) {
                eligibleDiscounts.push({
                    id: pwdDiscount._id,
                    code: pwdDiscount.code,
                    description: pwdDiscount.description,
                    type: 'PWD',
                    discountValue: pwdDiscount.discountValue,
                    discountType: pwdDiscount.discountType,
                    isVerified: user.customerProfile?.pwdVerified || false,
                    verificationStatus: user.customerProfile?.pwdVerified ? 'approved' : 'pending'
                });
            }
        }

        logger.info(`Retrieved eligible discounts for user: ${req.user.id}`, { count: eligibleDiscounts.length });

        res.json({
            message: 'Eligible discounts retrieved',
            discounts: eligibleDiscounts
        });
    } catch (error) {
        logger.error(`Error retrieving eligible discounts:`, error);
        next(error);
    }
});

/**
 * @route POST /api/discounts/apply-automatic
 * @description Apply automatic SC/PWD discount
 * @access Private (customer only)
 */
router.post('/apply-automatic', auth, async (req, res, next) => {
    try {
        const { discountType, orderAmount } = req.body;
        const User = require('../models/user');

        if (!discountType || !['SC', 'PWD'].includes(discountType)) {
            throw new BadRequestError('Invalid discount type. Must be SC or PWD');
        }

        if (!orderAmount || orderAmount < 0) {
            throw new BadRequestError('Valid order amount is required');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Check eligibility
        const isEligible = discountType === 'SC' ? 
            user.customerProfile?.isSeniorCitizen : 
            user.customerProfile?.isPWD;

        if (!isEligible) {
            throw new BadRequestError(`You are not eligible for ${discountType} discount`);
        }

        // Check if eligibility is verified by admin
        const isVerified = discountType === 'SC' ? 
            user.customerProfile?.scVerified : 
            user.customerProfile?.pwdVerified;

        if (!isVerified) {
            throw new BadRequestError(`Your ${discountType} eligibility is not yet approved. Please wait for admin verification.`);
        }

        // Check preference
        const preferenceKey = discountType === 'SC' ? 'useSCDiscount' : 'usePWDDiscount';
        if (!user.discountPreferences?.[preferenceKey]) {
            throw new BadRequestError(`${discountType} discount is disabled in your preferences`);
        }

        // Find the discount
        const now = new Date();
        const discount = await Discount.findOne({
            eligibilityType: discountType,
            isEligibilityBased: true,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (!discount) {
            throw new BadRequestError(`${discountType} discount is not currently available`);
        }

        // Check max total usage
        if (discount.maxTotalUsage && discount.currentUsage >= discount.maxTotalUsage) {
            throw new BadRequestError(`${discountType} discount has expired`);
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

        logger.info(`Applied ${discountType} discount for user: ${req.user.id}, amount: ${discountAmount}`);

        res.json({
            message: 'Discount applied successfully',
            discount: {
                id: discount._id,
                code: discount.code,
                description: discount.description,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                discountAmount,
                eligibilityType: discountType
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/discounts/toggle-automatic
 * @description Toggle automatic discount usage preference
 * @access Private (customer only)
 */
router.put('/toggle-automatic', auth, async (req, res, next) => {
    try {
        const { discountType, enabled } = req.body;
        const User = require('../models/user');

        if (!discountType || !['SC', 'PWD'].includes(discountType)) {
            throw new BadRequestError('Invalid discount type. Must be SC or PWD');
        }

        if (typeof enabled !== 'boolean') {
            throw new BadRequestError('Enabled must be a boolean');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Update preference
        const preferenceKey = discountType === 'SC' ? 'useSCDiscount' : 'usePWDDiscount';
        user.discountPreferences = user.discountPreferences || {};
        user.discountPreferences[preferenceKey] = enabled;
        user.updatedAt = new Date();

        await user.save();

        logger.info(`Toggled ${discountType} discount preference for user: ${req.user.id}, enabled: ${enabled}`);

        res.json({
            message: `${discountType} discount ${enabled ? 'enabled' : 'disabled'}`,
            preferences: user.discountPreferences
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/discounts/eligibility-stats
 * @description Get SC/PWD eligibility statistics
 * @access Private (requires admin or owner role)
 */
router.get('/eligibility-stats', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        const User = require('../models/user');
        const Discount = require('../models/discount');
        
        // Get SC/PWD eligibility discounts
        const scDiscount = await Discount.findOne({
            type: 'Senior Citizen',
            isEligibilityBased: true,
            isActive: true
        });
        
        const pwdDiscount = await Discount.findOne({
            type: 'PWD',
            isEligibilityBased: true,
            isActive: true
        });
        
        // Count users by eligibility status
        const totalSCUsers = await User.countDocuments({
            'eligibility.scStatus': 'approved'
        });
        
        const totalPWDUsers = await User.countDocuments({
            'eligibility.pwdStatus': 'approved'
        });
        
        // Calculate total discounts given (estimate based on discount usage)
        let totalSCDiscounts = 0;
        let totalPWDDiscounts = 0;
        
        if (scDiscount) {
            const scUsage = await DiscountUsage.countDocuments({
                discountId: scDiscount._id
            });
            totalSCDiscounts = scUsage * (scDiscount.discountPercentage || 0);
        }
        
        if (pwdDiscount) {
            const pwdUsage = await DiscountUsage.countDocuments({
                discountId: pwdDiscount._id
            });
            totalPWDDiscounts = pwdUsage * (pwdDiscount.discountPercentage || 0);
        }
        
        res.json({
            success: true,
            stats: {
                totalSCUsers,
                totalPWDUsers,
                scDiscountRate: scDiscount?.discountPercentage || 0,
                pwdDiscountRate: pwdDiscount?.discountPercentage || 0,
                totalSCDiscounts: Math.round(totalSCDiscounts * 100) / 100,
                totalPWDDiscounts: Math.round(totalPWDDiscounts * 100) / 100
            }
        });
    } catch (error) {
        logger.error('Error fetching eligibility stats:', error);
        next(error);
    }
});

/**
 * @route GET /api/discounts/eligibility-status
 * @description Get current user's SC/PWD eligibility status
 * @access Private (customer only)
 */
router.get('/eligibility-status', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            throw new BadRequestError('User not found');
        }

        res.json({
            success: true,
            eligibility: {
                sc: {
                    claimed: user.customerProfile?.isSeniorCitizen || false,
                    verified: user.customerProfile?.scVerified || false,
                    id: user.customerProfile?.scId || null,
                    document: user.customerProfile?.scDocument || null,
                    verifiedAt: user.customerProfile?.verifiedAt || null
                },
                pwd: {
                    claimed: user.customerProfile?.isPWD || false,
                    verified: user.customerProfile?.pwdVerified || false,
                    id: user.customerProfile?.pwdId || null,
                    document: user.customerProfile?.pwdDocument || null,
                    verifiedAt: user.customerProfile?.verifiedAt || null
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
