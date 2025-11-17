const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email Service
 * Handles all email notifications for order status updates
 */

// Initialize transporter with support for SendGrid, custom SMTP, and Gmail
let transporter;

if (process.env.SENDGRID_API_KEY) {
    // SendGrid configuration - use apikey@sendgrid.net with the API key as password
    transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false, // TLS
        auth: {
            user: 'apikey', // Required by SendGrid - do not change
            pass: process.env.SENDGRID_API_KEY
        },
        connectionUrl: null,
        tls: {
            rejectUnauthorized: false // Allow self-signed certificates
        }
    });
    console.log('[EmailService] Configured for SendGrid SMTP');
} else if (process.env.SMTP_HOST) {
    // Custom SMTP configuration (Mailtrap, etc.)
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    console.log('[EmailService] Configured for custom SMTP');
} else {
    // Gmail or other service
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    console.log('[EmailService] Configured for ' + (process.env.EMAIL_SERVICE || 'Gmail'));
}

/**
 * Verify email configuration is set up correctly
 */
async function verifyEmailConfig() {
    try {
        if (process.env.SENDGRID_API_KEY) {
            console.log('[EmailService] ✓ SendGrid API key configured');
            logger.info('✓ SendGrid API key configured');
            
            // Try to verify the connection (with timeout)
            const timeoutPromise = new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('Connection verification timeout')), 10000);
            });
            
            try {
                const verifyPromise = transporter.verify();
                await Promise.race([verifyPromise, timeoutPromise]);
                console.log('[EmailService] ✓ SendGrid connection verified');
                logger.info('✓ SendGrid connection verified');
                return true;
            } catch (verifyError) {
                console.warn('[EmailService] ⚠️ SendGrid connection verification failed:', verifyError.message);
                console.warn('[EmailService] This may be a network issue - emails may still work');
                logger.warn('⚠️ SendGrid connection could not be verified: ' + verifyError.message);
                // Don't fail - network might be slow
                return true;
            }
        } else if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            console.log('[EmailService] ✓ Email service configured');
            logger.info('✓ Email service configured');
            
            try {
                const timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error('Connection verification timeout')), 10000);
                });
                const verifyPromise = transporter.verify();
                await Promise.race([verifyPromise, timeoutPromise]);
                console.log('[EmailService] ✓ Email connection verified');
                return true;
            } catch (verifyError) {
                console.warn('[EmailService] ⚠️ Email connection verification failed:', verifyError.message);
                return true;
            }
        } else {
            console.warn('[EmailService] ⚠️ Email service not fully configured');
            logger.warn('⚠️ Email service not fully configured');
            return false;
        }
    } catch (error) {
        logger.error('Email service verification failed:', error.message);
        console.warn('[EmailService] ⚠️ Email notifications may be disabled - ' + error.message);
        return false;
    }
}

/**
 * Send generic email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(to, subject, htmlContent) {
    try {
        // Check if transporter is initialized
        if (!transporter) {
            console.error('[EmailService] Transporter not initialized - missing configuration');
            logger.error('Email service transporter not initialized');
            return false;
        }

        if (!process.env.SENDGRID_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD)) {
            console.warn('[EmailService] Email service not configured - skipping email send');
            logger.warn('Email service not configured - skipping email send');
            return false;
        }

        const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@quickorder.com';
        console.log(`[EmailService] Preparing to send email from: ${fromEmail} to: ${to}`);

        const mailOptions = {
            from: fromEmail,
            to: to,
            subject: subject,
            html: htmlContent
        };

        // Set timeout for sending email (30 seconds)
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Email send timeout (30s)')), 30000);
        });

        const sendPromise = transporter.sendMail(mailOptions);
        const info = await Promise.race([sendPromise, timeoutPromise]);

        logger.info(`Email sent successfully to ${to}`);
        console.log(`[EmailService] Email sent to ${to}: ${info.response || info.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send email to ${to}:`, error.message);
        console.error(`[EmailService] Error sending email to ${to}:`, error.message);
        
        // Log more details for debugging
        if (error.code) console.error(`[EmailService] Error code: ${error.code}`);
        if (error.response) console.error(`[EmailService] SMTP response: ${error.response}`);
        if (error.command) console.error(`[EmailService] SMTP command: ${error.command}`);
        
        return false;
    }
}

/**
 * Send payment verification email
 * @param {Object} order - Order object
 * @param {string} status - 'verified' or 'rejected'
 */
async function sendPaymentStatusEmail(order, status) {
    try {
        const subject = status === 'verified' 
            ? '✓ Payment Verified - Order Confirmed!' 
            : '❌ Payment Rejected - Action Required';

        const emailTemplate = status === 'verified'
            ? getPaymentVerifiedTemplate(order)
            : getPaymentRejectedTemplate(order);

        await sendEmail(order.email, subject, emailTemplate);
    } catch (error) {
        logger.error(`Failed to send payment ${status} email for order ${order.orderId}:`, error.message);
    }
}

/**
 * Send order preparing email
 * @param {Object} order - Order object
 */
async function sendPreparingEmail(order) {
    try {
        const subject = '👨‍🍳 Your Order is Being Prepared';
        const emailTemplate = getPreparingTemplate(order);
        await sendEmail(order.email, subject, emailTemplate);
    } catch (error) {
        logger.error(`Failed to send preparing email for order ${order.orderId}:`, error.message);
    }
}

/**
 * Send order ready email
 * @param {Object} order - Order object
 */
async function sendReadyEmail(order) {
    try {
        const subject = '✓ Your Order is Ready!';
        const emailTemplate = getReadyTemplate(order);
        await sendEmail(order.email, subject, emailTemplate);
    } catch (error) {
        logger.error(`Failed to send ready email for order ${order.orderId}:`, error.message);
    }
}

/**
 * Send order completed email
 * @param {Object} order - Order object
 */
async function sendCompletedEmail(order) {
    try {
        const subject = '🎉 Order Completed - Thank You!';
        const emailTemplate = getCompletedTemplate(order);
        await sendEmail(order.email, subject, emailTemplate);
    } catch (error) {
        logger.error(`Failed to send completed email for order ${order.orderId}:`, error.message);
    }
}

/**
 * Send order cancelled email
 * @param {Object} order - Order object
 * @param {string} reason - Reason for cancellation (optional)
 */
async function sendCancelledEmail(order, reason = '') {
    try {
        const subject = '⚠️ Your Order has been Cancelled';
        const emailTemplate = getCancelledTemplate(order, reason);
        await sendEmail(order.email, subject, emailTemplate);
    } catch (error) {
        logger.error(`Failed to send cancelled email for order ${order.orderId}:`, error.message);
    }
}

// ===== EMAIL TEMPLATES =====

function getPaymentVerifiedTemplate(order) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px 0; }
                .order-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .items { margin: 10px 0; }
                .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; color: #10b981; padding-top: 10px; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
                .success-badge { display: inline-block; background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payment Verified</h1>
                    <p>Your order has been confirmed!</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${order.customerName},</h2>
                    <p>Great news! We have verified your payment for Order <strong>#${order.orderId}</strong>.</p>
                    <p>Your order is now confirmed and will be prepared shortly.</p>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Delivery Type:</strong> ${order.deliveryType.toUpperCase()}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone}</p>
                        ${order.address ? `<p><strong>Address:</strong> ${order.address}</p>` : ''}
                        
                        <div class="items">
                            <h4>Items Ordered:</h4>
                            ${order.items.map(item => `
                                <div class="item">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="total">
                            Total: ₱${order.total.toFixed(2)}
                        </div>
                    </div>
                    
                    <p>Thank you for your order! We will notify you when your order is being prepared and when it's ready.</p>
                </div>
                
                <div class="footer">
                    <p>© QuickOrder - Thank you for your business!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getPaymentRejectedTemplate(order) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px 0; }
                .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .order-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Payment Rejected</h1>
                    <p>Action Required</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${order.customerName},</h2>
                    <p>Unfortunately, we were unable to verify your payment for Order <strong>#${order.orderId}</strong>.</p>
                    
                    <div class="warning">
                        <h3>What does this mean?</h3>
                        <p>Your order has been placed but cannot be processed until payment is verified. Please contact our support team to resolve this issue or try again with a different payment method.</p>
                    </div>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Total Amount:</strong> ₱${order.total.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    </div>
                    
                    <p>Please reach out to our customer service team if you need assistance.</p>
                </div>
                
                <div class="footer">
                    <p>© QuickOrder - We're here to help!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getPreparingTemplate(order) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px 0; }
                .status-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .items { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .item { padding: 8px 0; border-bottom: 1px solid #ddd; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👨‍🍳 Your Order is Being Prepared</h1>
                </div>
                
                <div class="content">
                    <h2>Hello ${order.customerName},</h2>
                    <p>Good news! Your Order <strong>#${order.orderId}</strong> is now being prepared in our kitchen.</p>
                    
                    <div class="status-box">
                        <h3>Status Update</h3>
                        <p>We're carefully preparing your order with the freshest ingredients. We'll notify you as soon as it's ready!</p>
                    </div>
                    
                    <div class="items">
                        <h3>Items Being Prepared:</h3>
                        ${order.items.map(item => `
                            <div class="item">
                                ${item.name} (${item.quantity}x) - ₱${(item.price * item.quantity).toFixed(2)}
                            </div>
                        `).join('')}
                    </div>
                    
                    <p>We estimate your order will be ready within the next 20-30 minutes.</p>
                </div>
                
                <div class="footer">
                    <p>© QuickOrder - We're preparing your delicious meal!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getReadyTemplate(order) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px 0; }
                .ready-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .pickup-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Your Order is Ready!</h1>
                </div>
                
                <div class="content">
                    <h2>Hello ${order.customerName},</h2>
                    <p>Great news! Your Order <strong>#${order.orderId}</strong> is ready for ${order.deliveryType === 'pickup' ? 'pickup' : 'delivery'}!</p>
                    
                    <div class="ready-box">
                        <h3>🎉 Order Ready</h3>
                        <p>Your delicious meal is prepared and waiting for you. ${order.deliveryType === 'pickup' ? 'Please come pick it up at your earliest convenience!' : 'Our delivery partner will bring it to you shortly!'}</p>
                    </div>
                    
                    <div class="pickup-info">
                        <h3>Order Details:</h3>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Total Amount:</strong> ₱${order.total.toFixed(2)}</p>
                        ${order.deliveryType === 'delivery' ? `<p><strong>Delivery Address:</strong> ${order.address}</p>` : ''}
                    </div>
                    
                    <p>Thank you for choosing QuickOrder!</p>
                </div>
                
                <div class="footer">
                    <p>© QuickOrder - Your meal awaits!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getCompletedTemplate(order) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px 0; }
                .completed-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .order-summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Order Completed!</h1>
                </div>
                
                <div class="content">
                    <h2>Hello ${order.customerName},</h2>
                    <p>Your Order <strong>#${order.orderId}</strong> has been completed!</p>
                    
                    <div class="completed-box">
                        <h3>✓ Order Complete</h3>
                        <p>We hope you enjoyed your meal from QuickOrder. Thank you for your business!</p>
                    </div>
                    
                    <div class="order-summary">
                        <h3>Order Summary:</h3>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Total Paid:</strong> ₱${order.total.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    </div>
                    
                    <p>If you have any feedback or concerns, please don't hesitate to reach out to our support team.</p>
                </div>
                
                <div class="footer">
                    <p>© QuickOrder - We look forward to serving you again soon!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getCancelledTemplate(order, reason = '') {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px 0; }
                .cancelled-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .order-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Order Cancelled</h1>
                </div>
                
                <div class="content">
                    <h2>Hello ${order.customerName},</h2>
                    <p>Your Order <strong>#${order.orderId}</strong> has been cancelled.</p>
                    
                    <div class="cancelled-box">
                        <h3>Order Cancellation</h3>
                        <p>${reason ? `<strong>Reason:</strong> ${reason}` : 'Your order has been cancelled as requested.'}</p>
                    </div>
                    
                    <div class="order-details">
                        <h3>Order Details:</h3>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Amount:</strong> ₱${order.total.toFixed(2)}</p>
                        <p>Any refunds will be processed according to your payment method's terms.</p>
                    </div>
                    
                    <p>If you have any questions about this cancellation, please contact our support team.</p>
                </div>
                
                <div class="footer">
                    <p>© QuickOrder - We hope to serve you again!</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Export functions
module.exports = {
    verifyEmailConfig,
    sendEmail,
    sendPaymentStatusEmail,
    sendPreparingEmail,
    sendReadyEmail,
    sendCompletedEmail,
    sendCancelledEmail
};
