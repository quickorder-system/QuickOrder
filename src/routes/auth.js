const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');

const { validateRegistration, validateLogin } = require('../middleware/validation');

/**
 * @route POST /api/auth/login
 * @description Authenticate user and get token
 * @access Public
 */
router.post('/login', validateLogin, async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, role: user.role } });
            }
        );

    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
router.post('/register', validateRegistration, async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password, role: 'customer' }); // Default role to customer
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/check-username
 * @description Check if username exists (for forgot password flow)
 * @access Public
 */
router.post('/check-username', async (req, res, next) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            throw new BadRequestError('Username is required');
        }

        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({ 
                exists: false,
                message: 'User not found'
            });
        }

        res.json({ 
            exists: true,
            role: user.role,
            message: 'User found'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/reset-test-users
 * @description Reset test users (FOR DEVELOPMENT ONLY)
 * @access Public
 */
router.post('/reset-test-users', async (req, res, next) => {
    try {
        // Delete existing test users
        await User.deleteMany({ username: { $in: ['admin', 'owner'] } });

        // Create new test users
        const adminUser = new User({
            username: 'admin',
            password: 'admin123',
            role: 'admin'
        });
        await adminUser.save();
        
        const adminUser2 = new User({
            username: 'admin1',
            password: 'admin1234',
            role: 'admin'
        });
        await adminUser2.save();

        const ownerUser = new User({
            username: 'owner',
            password: 'owner123',
            role: 'owner'
        });
        await ownerUser.save();

        res.json({ 
            message: 'Test users reset successfully',
            credentials: [
                { username: 'admin', password: 'admin123', role: 'admin' },
                { username: 'admin1', password: 'admin1234', role: 'admin' },
                { username: 'owner', password: 'owner123', role: 'owner' }
            ]
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/reset-password
 * @description Reset password for admin/owner users
 * @access Public
 */
router.post('/reset-password', async (req, res, next) => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            throw new BadRequestError('Username and new password are required');
        }

        if (newPassword.length < 6) {
            throw new BadRequestError('Password must be at least 6 characters long');
        }

        const user = await User.findOne({ username });
        
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Only allow password reset for admin/owner users
        if (!['admin', 'owner'].includes(user.role)) {
            throw new UnauthorizedError('Password reset only available for admin and owner accounts');
        }

        user.password = newPassword;
        await user.save();

        res.json({ 
            message: 'Password reset successfully',
            success: true
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/create-user
 * @description Create a new user with a specified role (Admin/Owner only)
 * @access Private (Admin/Owner)
 */
router.post('/create-user', [auth, authorize(['admin', 'owner']), validateRegistration], async (req, res, next) => {
    try {
        const { username, password, role } = req.body;

        // Ensure the role is valid
        if (!['admin', 'owner', 'customer'].includes(role)) {
            throw new BadRequestError('Invalid role specified');
        }

        const user = new User({ username, password, role });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
