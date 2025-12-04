/**
 * Authentication Controller
 * Handles all authentication business logic
 */

const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Generate JWT Token
 */
function generateToken(user) {
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
 * Generate random token for email verification/password reset
 */
function generateRandomToken() {
    return crypto.randomBytes(32).toString('hex');
}

const authController = {
    /**
     * Customer Registration
     */
    async registerCustomer(req, res, next) {
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
    },

    /**
     * Customer Login
     */
    async loginCustomer(req, res, next) {
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
            const token = generateToken(user);

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
    },

    /**
     * Verify Email
     */
    async verifyEmail(req, res, next) {
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
    },

    /**
     * Resend Verification Email
     */
    async resendVerificationEmail(req, res, next) {
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
    },

    /**
     * Request Password Reset
     */
    async requestPasswordReset(req, res, next) {
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
    },

    /**
     * Reset Password
     */
    async resetPassword(req, res, next) {
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
    },

    /**
     * Get Current User
     */
    async getCurrentUser(req, res, next) {
        try {
            const user = await User.findById(req.user.id).select('-password');
            res.json(user);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Logout
     */
    async logout(req, res, next) {
        try {
            logger.info(`Customer logged out: ${req.user.email}`);
            res.json({ message: 'Logout successful' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
