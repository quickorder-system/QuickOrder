/**
 * Customer Controller
 * Handles all customer-related business logic
 */

const User = require('../models/user');
const Order = require('../models/order');
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

const customerController = {
    /**
     * Get customer profile
     */
    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.id)
                .select('-password -emailVerificationToken -passwordResetToken');

            if (!user) {
                throw new BadRequestError('User not found');
            }

            res.json(user);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update customer profile
     */
    async updateProfile(req, res, next) {
        try {
            const { name, phone, preferences } = req.body;

            const user = await User.findById(req.user.id);

            if (!user) {
                throw new BadRequestError('User not found');
            }

            // Update allowed fields
            if (name !== undefined) user.name = name;
            if (phone !== undefined) user.phone = phone;

            if (preferences) {
                user.preferences = {
                    notifications: preferences.notifications !== undefined ? preferences.notifications : user.preferences?.notifications || true,
                    smsNotifications: preferences.smsNotifications !== undefined ? preferences.smsNotifications : user.preferences?.smsNotifications || false,
                    marketingEmails: preferences.marketingEmails !== undefined ? preferences.marketingEmails : user.preferences?.marketingEmails || true
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
                    preferences: user.preferences
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Change customer password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

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
    },

    /**
     * Get customer's order history
     */
    async getOrders(req, res, next) {
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
    },

    /**
     * Get specific order details
     */
    async getOrderDetails(req, res, next) {
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
    },

    /**
     * Get all delivery addresses
     */
    async getAddresses(req, res, next) {
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
    },

    /**
     * Add new delivery address
     */
    async addAddress(req, res, next) {
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
    },

    /**
     * Update delivery address
     */
    async updateAddress(req, res, next) {
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
    },

    /**
     * Delete delivery address
     */
    async deleteAddress(req, res, next) {
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
    },

    /**
     * Set address as default
     */
    async setDefaultAddress(req, res, next) {
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
    }
};

module.exports = customerController;
