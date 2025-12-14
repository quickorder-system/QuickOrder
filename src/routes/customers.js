const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const Order = require('../models/order');
const logger = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');

// Configure multer for eligibility document uploads
const eligibilityStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'eligibility');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});

const eligibilityUpload = multer({
  storage: eligibilityStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    } else {
      cb(null, true);
    }
  }
});

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
        const { name, phone, address, preferences } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Update allowed fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        
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
                phone: user.phone,
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

/**
 * @route POST /api/customers/change-password
 * @description Change customer password
 * @access Private
 */
router.post('/change-password', auth, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const bcrypt = require('bcrypt');

        if (!currentPassword || !newPassword) {
            throw new BadRequestError('Current password and new password are required');
        }

        if (newPassword.length < 6) {
            throw new BadRequestError('New password must be at least 6 characters');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Current password is incorrect');
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.updatedAt = new Date();
        await user.save();

        logger.info(`Customer password changed: ${user.email}`);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/customers/addresses
 * @description Get all delivery addresses
 * @access Private
 */
router.get('/addresses', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');

        if (!user) {
            throw new BadRequestError('User not found');
        }

        res.json({
            addresses: user.addresses || []
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/customers/addresses
 * @description Add new delivery address
 * @access Private
 */
router.post('/addresses', auth, async (req, res, next) => {
    try {
        const { label, street, city, postalCode, phone } = req.body;

        if (!street || !city || !postalCode) {
            throw new BadRequestError('Street, city, and postal code are required');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Initialize addresses array if it doesn't exist
        if (!user.addresses) {
            user.addresses = [];
        }

        // If this is the first address, make it default
        const isDefault = user.addresses.length === 0;

        const newAddress = {
            label: label || 'home',
            street,
            city,
            postalCode,
            phone: phone || '',
            isDefault
        };

        user.addresses.push(newAddress);
        user.updatedAt = new Date();
        await user.save();

        logger.info(`Address added for customer: ${user.email}`);

        res.status(201).json({
            message: 'Address added successfully',
            address: user.addresses[user.addresses.length - 1]
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/customers/addresses/:addressId
 * @description Update delivery address
 * @access Private
 */
router.put('/addresses/:addressId', auth, async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const { label, street, city, postalCode, phone } = req.body;

        if (!street || !city || !postalCode) {
            throw new BadRequestError('Street, city, and postal code are required');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        const address = user.addresses.find(addr => addr._id.toString() === addressId);
        if (!address) {
            throw new BadRequestError('Address not found');
        }

        // Update address fields
        address.label = label || address.label;
        address.street = street;
        address.city = city;
        address.postalCode = postalCode;
        address.phone = phone || address.phone;

        user.updatedAt = new Date();
        await user.save();

        logger.info(`Address updated for customer: ${user.email}`);

        res.json({
            message: 'Address updated successfully',
            address
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/customers/addresses/:addressId
 * @description Delete delivery address
 * @access Private
 */
router.delete('/addresses/:addressId', auth, async (req, res, next) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            throw new BadRequestError('Address not found');
        }

        // If deleting the default address, set the first remaining as default
        if (user.addresses[addressIndex].isDefault && user.addresses.length > 1) {
            user.addresses[0].isDefault = true;
        }

        user.addresses.splice(addressIndex, 1);
        user.updatedAt = new Date();
        await user.save();

        logger.info(`Address deleted for customer: ${user.email}`);

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/customers/addresses/:addressId/default
 * @description Set address as default
 * @access Private
 */
router.put('/addresses/:addressId/default', auth, async (req, res, next) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Find the address
        const address = user.addresses.find(addr => addr._id.toString() === addressId);
        if (!address) {
            throw new BadRequestError('Address not found');
        }

        // Reset all addresses to not default
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set selected address as default
        address.isDefault = true;

        user.updatedAt = new Date();
        await user.save();

        logger.info(`Default address set for customer: ${user.email}`);

        res.json({
            message: 'Default address set successfully',
            address
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/customers/profile/eligibility
 * @description Update customer eligibility profile (SC/PWD status)
 * @access Private
 */
router.put('/profile/eligibility', auth, eligibilityUpload.fields([
    { name: 'scDocument', maxCount: 1 },
    { name: 'pwdDocument', maxCount: 1 }
]), async (req, res, next) => {
    try {
        const { isSeniorCitizen, isPWD, scId, pwdId } = req.body;
        logger.info(`Eligibility update request from user ${req.user.id}:`, { isSeniorCitizen, isPWD, scId, pwdId, files: req.files });
        logger.info('Raw body:', req.body);

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Initialize customerProfile if doesn't exist
        user.customerProfile = user.customerProfile || {};

        // Parse boolean strings from FormData - handle different formats
        const scBool = isSeniorCitizen === 'true' || isSeniorCitizen === true || isSeniorCitizen === 1;
        const pwdBool = isPWD === 'true' || isPWD === true || isPWD === 1;

        logger.info('Parsed booleans:', { scBool, pwdBool });

        // Validate that both SC and PWD are not true at the same time
        if (scBool && pwdBool) {
            throw new BadRequestError('You can only claim either SC or PWD, not both');
        }

        // Update eligibility status
        user.customerProfile.isSeniorCitizen = scBool;
        user.customerProfile.isPWD = pwdBool;

        // Always reset verification status when claiming
        if (scBool) {
            user.customerProfile.scVerified = false;
        } else {
            user.customerProfile.scVerified = false;
        }

        if (pwdBool) {
            user.customerProfile.pwdVerified = false;
        } else {
            user.customerProfile.pwdVerified = false;
        }

        // Update SC eligibility
        if (scBool) {
            if (!scId) {
                throw new BadRequestError('SC ID is required');
            }
            if (!req.files?.scDocument?.[0]) {
                throw new BadRequestError('SC document is required');
            }
            user.customerProfile.scId = scId;
            user.customerProfile.scDocument = `/uploads/eligibility/${req.files.scDocument[0].filename}`;
            user.customerProfile.scVerified = false; // Reset verification status
            // Clear PWD
            user.customerProfile.pwdId = null;
            user.customerProfile.pwdDocument = null;
        } else {
            user.customerProfile.scId = null;
            user.customerProfile.scDocument = null;
            user.customerProfile.scVerified = false;
        }

        // Update PWD eligibility
        if (pwdBool) {
            if (!pwdId) {
                throw new BadRequestError('PWD ID is required');
            }
            if (!req.files?.pwdDocument?.[0]) {
                throw new BadRequestError('PWD document is required');
            }
            user.customerProfile.pwdId = pwdId;
            user.customerProfile.pwdDocument = `/uploads/eligibility/${req.files.pwdDocument[0].filename}`;
            user.customerProfile.pwdVerified = false; // Reset verification status
            // Clear SC
            user.customerProfile.scId = null;
            user.customerProfile.scDocument = null;
        } else {
            user.customerProfile.pwdId = null;
            user.customerProfile.pwdDocument = null;
            user.customerProfile.pwdVerified = false;
        }

        user.updatedAt = new Date();
        await user.save();

        logger.info(`Updated eligibility profile for customer: ${user.email}, SC: ${user.customerProfile.isSeniorCitizen}, PWD: ${user.customerProfile.isPWD}`);
        logger.info(`Updated eligibility profile for customer: ${user.email}, SC: ${user.customerProfile.isSeniorCitizen}, PWD: ${user.customerProfile.isPWD}`);

        res.json({
            message: 'Eligibility profile updated successfully',
            customerProfile: user.customerProfile,
            discountPreferences: user.discountPreferences
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/customers/verify-eligibility
 * @description Admin endpoint to verify SC/PWD eligibility
 * @access Private (admin/owner only)
 */
router.post('/verify-eligibility', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        const { customerId, eligibilityType, approveStatus } = req.body;
        const ActivityLog = require('../models/activityLog');

        if (!customerId || !['SC', 'PWD'].includes(eligibilityType) || !['approved', 'rejected'].includes(approveStatus)) {
            throw new BadRequestError('Invalid parameters: customerId, eligibilityType (SC/PWD), and approveStatus (approved/rejected) required');
        }

        const customer = await User.findById(customerId);
        if (!customer) {
            throw new BadRequestError('Customer not found');
        }

        // Update verification status
        const verificationField = eligibilityType === 'SC' ? 'scVerified' : 'pwdVerified';
        if (approveStatus === 'approved') {
            customer.customerProfile[verificationField] = true;
            customer.customerProfile.verifiedAt = new Date();
        } else {
            customer.customerProfile[verificationField] = false;
        }

        customer.updatedAt = new Date();
        await customer.save();

        // Log activity
        await ActivityLog.create({
            userId: req.user.id,
            action: 'VERIFY_ELIGIBILITY',
            page: 'ADMIN',
            description: `${approveStatus === 'approved' ? 'Approved' : 'Rejected'} ${eligibilityType} eligibility for customer: ${customer.email}`,
            details: {
                customerId: customerId,
                eligibilityType: eligibilityType,
                approveStatus: approveStatus,
                customerEmail: customer.email
            }
        });

        logger.info(`${eligibilityType} eligibility ${approveStatus} for customer: ${customer.email} by admin: ${req.user.id}`);

        res.json({
            message: `${eligibilityType} eligibility ${approveStatus}`,
            customer: {
                id: customer._id,
                email: customer.email,
                name: customer.name,
                customerProfile: customer.customerProfile
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/customers/discount-preferences
 * @description Update customer discount preferences
 * @access Private
 */
router.put('/discount-preferences', auth, async (req, res, next) => {
    try {
        const { useSCDiscount, usePWDDiscount } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Initialize discountPreferences if doesn't exist
        user.discountPreferences = user.discountPreferences || {};

        // Update preferences
        if (typeof useSCDiscount === 'boolean') {
            user.discountPreferences.useSCDiscount = useSCDiscount;
        }

        if (typeof usePWDDiscount === 'boolean') {
            user.discountPreferences.usePWDDiscount = usePWDDiscount;
        }

        user.updatedAt = new Date();
        await user.save();

        logger.info(`Updated discount preferences for customer: ${user.email}`);

        res.json({
            message: 'Discount preferences updated successfully',
            discountPreferences: user.discountPreferences
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/customers/pending-verifications
 * @description Get list of customers with pending SC/PWD verification
 * @access Private (admin/owner only)
 */
router.get('/pending-verifications', [auth, authorize(['admin', 'owner'])], async (req, res, next) => {
    try {
        // Find users who have claimed SC/PWD but not yet verified
        const pendingVerifications = await User.find({
            $or: [
                {
                    'customerProfile.isSeniorCitizen': true,
                    'customerProfile.scVerified': false
                },
                {
                    'customerProfile.isPWD': true,
                    'customerProfile.pwdVerified': false
                }
            ]
        }).select('_id name email customerProfile').exec();

        // Format the response
        const formattedRequests = [];
        
        pendingVerifications.forEach(user => {
            if (user && user.customerProfile) {
                if (user.customerProfile.isSeniorCitizen && !user.customerProfile.scVerified) {
                    formattedRequests.push({
                        id: user._id.toString(),
                        userName: user.name || 'Unknown',
                        userEmail: user.email || 'undefined',
                        type: 'Senior Citizen',
                        idNumber: user.customerProfile.scId || 'N/A',
                        status: 'pending',
                        customerId: user._id.toString()
                    });
                }
                if (user.customerProfile.isPWD && !user.customerProfile.pwdVerified) {
                    formattedRequests.push({
                        id: user._id.toString(),
                        userName: user.name || 'Unknown',
                        userEmail: user.email || 'undefined',
                        type: 'PWD',
                        idNumber: user.customerProfile.pwdId || 'N/A',
                        status: 'pending',
                        customerId: user._id.toString()
                    });
                }
            }
        });

        res.json({
            success: true,
            data: formattedRequests,
            count: formattedRequests.length
        });

    } catch (error) {
        logger.error('Error fetching pending verifications:', error);
        next(error);
    }
});

module.exports = router;
