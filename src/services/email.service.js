const nodemailer = require('nodemailer');
const https = require('https');
const logger = require('../utils/logger');

/**
 * Email Service
 * Handles all email notifications for order status updates
 * Uses SendGrid Web API (HTTP) for maximum reliability in cloud environments
 */

let transporter;
let useSendGridAPI = false;

if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid HTTP API (most reliable for cloud environments)
    useSendGridAPI = true;
    console.log('[EmailService] Configured for SendGrid HTTP Web API');
} else if (process.env.SMTP_HOST) {
    // Custom SMTP configuration
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 90000,
        socketTimeout: 90000
    });
    console.log('[EmailService] Configured for custom SMTP');
} else {
    // Gmail fallback
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 90000,
        socketTimeout: 90000
    });
    console.log('[EmailService] Configured for ' + (process.env.EMAIL_SERVICE || 'Gmail'));
}

/**
 * Send email via SendGrid HTTP API
 */
function sendViaAPI(to, subject, htmlContent) {
    return new Promise((resolve, reject) => {
        const fromEmail = process.env.EMAIL_FROM || 'noreply@quickorder.com';
        
        const payload = JSON.stringify({
            personalizations: [
                {
                    to: [{ email: to }]
                }
            ],
            from: { email: fromEmail },
            subject: subject,
            content: [
                {
                    type: 'text/html',
                    value: htmlContent
                }
            ]
        });

        const options = {
            hostname: 'api.sendgrid.com',
            port: 443,
            path: '/v3/mail/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`[EmailService] ✅ Email sent via API to ${to}`);
                    resolve(true);
                } else {
                    console.error(`[EmailService] API Error (${res.statusCode}):`, data);
                    reject(new Error(`SendGrid API returned ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('[EmailService] ❌ API Request error:', error.message);
            reject(error);
        });

        // 30 second timeout for HTTP request
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('SendGrid API request timeout'));
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Verify email configuration is set up correctly
 */
async function verifyEmailConfig() {
    try {
        if (useSendGridAPI && process.env.SENDGRID_API_KEY) {
            console.log('[EmailService] ✓ SendGrid API key configured');
            logger.info('✓ SendGrid API key configured');
            // SendGrid HTTP API doesn't require connection verification
            // Configuration check is sufficient
            return true;
        } else if (transporter && process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
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
        if (useSendGridAPI && process.env.SENDGRID_API_KEY) {
            // Use SendGrid HTTP API (most reliable)
            console.log(`[EmailService] Sending via SendGrid API to ${to}`);
            await sendViaAPI(to, subject, htmlContent);
            logger.info(`Email sent successfully to ${to} via API`);
            return true;
        }

        // Check if transporter is initialized
        if (!transporter) {
            console.error('[EmailService] Transporter not initialized - missing configuration');
            logger.error('Email service transporter not initialized');
            return false;
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
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

        // Set timeout for SMTP sending (90 seconds)
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Email send timeout (90s)')), 90000);
        });

        const sendPromise = transporter.sendMail(mailOptions);
        const info = await Promise.race([sendPromise, timeoutPromise]);

        logger.info(`Email sent successfully to ${to}`);
        console.log(`[EmailService] ✅ Email sent to ${to}: ${info.response || info.messageId}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send email to ${to}:`, error.message);
        console.error(`[EmailService] ❌ Error sending email to ${to}:`, error.message);
        
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

/**
 * Authentication Email Functions
 */

async function sendVerificationEmail(user, verificationToken) {
    // Determine the correct client URL based on environment
    let baseUrl = process.env.CLIENT_URL;
    if (!baseUrl) {
        if (process.env.NODE_ENV === 'production') {
            baseUrl = 'https://quickorder-production-145f.up.railway.app';
        } else {
            baseUrl = 'http://localhost:3000';
        }
    }
    const verificationLink = `${baseUrl}/verifyEmail.html?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
    
    const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin: 0;">QuickOrder</h1>
                </div>
                
                <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Hello ${user.name || user.email},
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with QuickOrder! Please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Verify Email Address</a>
                </div>
                
                <p style="color: #999; font-size: 14px; text-align: center;">
                    Or copy this link: <br><span style="word-break: break-all;">${verificationLink}</span>
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.6;">
                    This link will expire in 24 hours. If you didn't create this account, please ignore this email.
                </p>
                
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px;">© QuickOrder - ${new Date().getFullYear()}</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    return sendEmail(user.email, 'Verify Your QuickOrder Email Address', htmlContent);
}

async function sendPasswordResetEmail(user, resetToken) {
    // Determine the correct client URL based on environment
    let clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) {
        if (process.env.NODE_ENV === 'production') {
            clientUrl = 'https://quickorder-production-145f.up.railway.app';
        } else {
            clientUrl = 'http://localhost:3000';
        }
    }
    const resetLink = `${clientUrl}/resetPassword.html?token=${resetToken}`;
    
    const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin: 0;">QuickOrder</h1>
                </div>
                
                <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Hello ${user.name || user.email},
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your QuickOrder password. Click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #008CBA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Reset Password</a>
                </div>
                
                <p style="color: #999; font-size: 14px; text-align: center;">
                    Or copy this link: ${resetLink}
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.6;">
                    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                </p>
                
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px;">© QuickOrder - ${new Date().getFullYear()}</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    return sendEmail(user.email, 'Reset Your QuickOrder Password', htmlContent);
}

// Export functions
module.exports = {
    verifyEmailConfig,
    sendEmail,
    sendPaymentStatusEmail,
    sendPreparingEmail,
    sendReadyEmail,
    sendCompletedEmail,
    sendCancelledEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
};
