const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

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
                username: user.username,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
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

/**
 * CUSTOMER AUTHENTICATION ENDPOINTS
 */

/**
 * Helper function: Generate JWT Token
 */
function generateCustomerToken(user) {
    return jwt.sign(
        {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

/**
 * Helper function: Generate random token for email verification/password reset
 */
function generateRandomToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * @route POST /api/auth/customer/register
 * @description Register new customer account
 * @access Public
 */
router.post('/customer/register', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            throw new BadRequestError('Email, password, and name are required');
        }

        if (password.length < 6) {
            throw new BadRequestError('Password must be at least 6 characters');
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            throw new BadRequestError('Email already registered');
        }

        // Create verification token
        const verificationToken = generateRandomToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user
        user = new User({
            email,
            password,
            name,
            role: 'customer',
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: tokenExpiry,
            emailVerified: false
        });

        // Save user (password will be hashed by pre-save hook)
        await user.save();

        // Send verification email
        await emailService.sendVerificationEmail(user, verificationToken);

        logger.info(`Customer registered: ${email}`);

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/customer/login
 * @description Customer login
 * @access Public
 */
router.post('/customer/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            throw new BadRequestError('Email and password are required');
        }

        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Compare password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(400).json({
                message: 'Email not verified. Please check your email for verification link.',
                requiresEmailVerification: true
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = generateCustomerToken(user);

        logger.info(`Customer logged in: ${email}`);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/customer/verify-email
 * @description Verify email with token
 * @access Public
 */
router.post('/customer/verify-email', async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            throw new BadRequestError('Verification token is required');
        }

        // Find user with matching token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            throw new BadRequestError('Invalid or expired verification token');
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpiry = null;
        await user.save();

        logger.info(`Email verified: ${user.email}`);

        res.json({
            message: 'Email verified successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/customer/resend-verification
 * @description Resend verification email
 * @access Public
 */
router.post('/customer/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new BadRequestError('Email is required');
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new BadRequestError('User not found');
        }

        if (user.emailVerified) {
            throw new BadRequestError('Email is already verified');
        }

        // Generate new verification token
        const verificationToken = generateRandomToken();
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpiry = tokenExpiry;
        await user.save();

        // Send verification email
        await emailService.sendVerificationEmail(user, verificationToken);

        logger.info(`Verification email resent: ${email}`);

        res.json({ message: 'Verification email sent. Please check your email.' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/customer/forgot-password
 * @description Request password reset
 * @access Public
 */
router.post('/customer/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new BadRequestError('Email is required');
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({ message: 'If email exists, password reset link will be sent' });
        }

        // Generate password reset token
        const resetToken = generateRandomToken();
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.passwordResetToken = resetToken;
        user.passwordResetTokenExpiry = tokenExpiry;
        await user.save();

        // Send password reset email
        await emailService.sendPasswordResetEmail(user, resetToken);

        logger.info(`Password reset requested: ${email}`);

        res.json({ message: 'If email exists, password reset link will be sent' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/customer/reset-password
 * @description Reset password with token
 * @access Public
 */
router.post('/customer/reset-password', async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            throw new BadRequestError('Token and new password are required');
        }

        if (newPassword.length < 6) {
            throw new BadRequestError('Password must be at least 6 characters');
        }

        // Find user with matching token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            throw new BadRequestError('Invalid or expired password reset token');
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetTokenExpiry = null;
        await user.save();

        logger.info(`Password reset: ${user.email}`);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/auth/customer/me
 * @description Get current customer (requires authentication)
 * @access Private
 */
router.get('/customer/me', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/customer/logout
 * @description Logout (mainly frontend token cleanup, but documented for API completeness)
 * @access Private
 */
router.post('/customer/logout', auth, async (req, res, next) => {
    try {
        logger.info(`Customer logged out: ${req.user.email}`);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

