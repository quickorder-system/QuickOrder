const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');

/**
 * @route GET /api/health
 * @description Check API health
 * @access Public
 */
router.get('/', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            sendgridConfigured: !!process.env.SENDGRID_API_KEY,
            emailFromConfigured: !!process.env.EMAIL_FROM,
            emailServiceConfigured: !!process.env.EMAIL_SERVICE
        }
    };
    res.status(200).json(health);
});

/**
 * @route POST /api/health/test-email
 * @description Test email configuration by sending a test email
 * @access Public (for testing - should be restricted in production)
 */
router.post('/test-email', async (req, res) => {
    try {
        const { to } = req.body;
        
        if (!to) {
            return res.status(400).json({ error: 'Email address required' });
        }

        console.log('[Health] Testing email configuration with recipient:', to);
        
        const testHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                    .content { padding: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✓ Test Email Success</h1>
                    </div>
                    <div class="content">
                        <h2>Email Configuration Test</h2>
                        <p>If you received this email, your email service is working correctly!</p>
                        <p>This is a test email from QuickOrder API.</p>
                        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const success = await emailService.sendEmail(
            to,
            'QuickOrder - Test Email',
            testHtml
        );

        if (success) {
            res.status(200).json({ 
                status: 'success', 
                message: 'Test email sent successfully',
                recipient: to
            });
        } else {
            res.status(500).json({ 
                status: 'failed', 
                message: 'Failed to send test email - check server logs'
            });
        }
    } catch (error) {
        console.error('[Health] Error in test email route:', error);
        res.status(500).json({ 
            status: 'error', 
            error: error.message 
        });
    }
});

module.exports = router;
