# Email Service Setup & Testing Guide

## Status
✅ **Email service has been improved** with better error handling, timeout management, and debug logging.

## Quick Diagnosis

### Testing Email Configuration

After deployment to Railway, you can test if emails are working by making a POST request:

```bash
curl -X POST https://your-railway-app.up.railway.app/api/health/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@gmail.com"}'
```

**Expected Response (Success):**
```json
{
  "status": "success",
  "message": "Test email sent successfully",
  "recipient": "your-email@gmail.com"
}
```

**Expected Response (Failure):**
```json
{
  "status": "failed",
  "message": "Failed to send test email - check server logs"
}
```

---

## SendGrid Configuration on Railway

### Step 1: Verify SendGrid API Key

In Railway Dashboard:
1. Go to your QuickOrder project
2. Click "Variables"
3. Check that `SENDGRID_API_KEY` is set

**Format should be:**
```
SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Verify Email Sender

Make sure you have these variables set:

```
SENDGRID_API_KEY=SG.xxxxxx...
EMAIL_FROM=QuickOrder <noreply@quickorder.com>
```

### Step 3: Check Railway Logs

In Railway Dashboard:
1. Click "Logs"
2. Search for `[EmailService]` to see initialization messages
3. Look for lines like:
   - `[EmailService] Configured for SendGrid SMTP`
   - `[EmailService] ✓ SendGrid API key configured`

---

## Common Issues & Solutions

### Issue: "Connection timeout"

**Cause:** SendGrid SMTP server is not responding
- Network connectivity issue
- Firewall blocking port 587
- SendGrid servers temporarily down

**Solution:**
1. Verify internet connectivity in Railway
2. Test SendGrid status: https://status.sendgrid.com/
3. Check if SENDGRID_API_KEY is correctly set
4. Try restarting the Railway app

### Issue: "Invalid credentials"

**Cause:** SendGrid API key is incorrect or invalid

**Solution:**
1. Go to SendGrid dashboard
2. Copy a NEW API key (or verify the existing one)
3. Update `SENDGRID_API_KEY` in Railway variables
4. Restart the app

### Issue: "Authentication failed"

**Cause:** The API key format is wrong or expired

**Solution:**
1. Generate a new SendGrid API key:
   - Go to SendGrid Account > Settings > API Keys
   - Create new key with "Mail Send" permission
   - Copy the full key (starts with "SG.")
2. Update Railway variable
3. Restart app

---

## Checking Email Logs

### In Railway Console

After sending a test email or placing an order, look for these log messages:

```
[EmailService] Email sent to customer@example.com: 250 Message accepted
```

Or on failure:

```
[EmailService] Error sending email to customer@example.com: Connection timeout
```

### Testing Flow

When you place an order:
1. Order is created and saved
2. When status is changed to "preparing", "ready", "complete", or "cancelled", an email is sent
3. Check Railway logs for `[EmailService]` messages

---

## What Was Fixed

1. **Better Timeout Handling**: Emails now have a 30-second timeout to prevent indefinite hangs
2. **Improved TLS Configuration**: Added proper TLS settings for SendGrid SMTP
3. **Better Error Logging**: More detailed error messages to diagnose issues
4. **Email Verification**: Service now attempts to verify connection on startup
5. **Test Endpoint**: Added `/api/health/test-email` endpoint for testing

---

## Next Steps

1. **Verify SendGrid API Key** in Railway variables
2. **Check Email Sender Address** is valid
3. **Test Email Configuration** using the endpoint above
4. **Monitor Logs** after placing orders to confirm emails send
5. **Check SendGrid Dashboard** to see delivered emails

---

## Email Troubleshooting Checklist

- [ ] SendGrid account created (sendgrid.com)
- [ ] API key generated with "Mail Send" permission
- [ ] `SENDGRID_API_KEY` variable set in Railway (format: SG.xxx...)
- [ ] `EMAIL_FROM` variable set (format: name <email@domain>)
- [ ] Railway app restarted after adding variables
- [ ] Test email endpoint returns success
- [ ] Order status update triggers email send
- [ ] Check Railway logs for `[EmailService]` messages
- [ ] Verify email received in inbox (check spam folder)

---

## Production Best Practices

- ✅ Use strong, unique SendGrid API keys
- ✅ Rotate API keys annually
- ✅ Monitor SendGrid dashboard for failed deliveries
- ✅ Set up SendGrid event webhooks to track bounces/complaints
- ✅ Use a branded sender email (e.g., orders@quickorder.com)
- ✅ Monitor email delivery rates

---

**Last Updated:** November 17, 2025
