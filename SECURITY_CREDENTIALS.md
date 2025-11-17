# QuickOrder - Production Credentials & Security Guide

⚠️ **CRITICAL SECURITY NOTICE**

This document outlines what credentials you need to create for production deployment. **Never commit actual credentials to git.** Always use environment variables on your hosting platform.

---

## Production Credentials Required

### 1. MongoDB Atlas Database

**What You Need:**
- Production MongoDB database with separate credentials from local development

**Steps to Create:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account (M0 tier is sufficient for startup)
3. Create a new cluster (e.g., `quickorder-prod`)
4. Create a database user with strong password (NOT the same as local)
5. Whitelist your hosting platform IP address
6. Copy the connection string

**Connection String Format:**
```
mongodb+srv://production_user:strong_password@cluster.mongodb.net/quickOrderDB?retryWrites=true&w=majority
```

**Store in Production Environment Variable:**
```
MONGO_URI=mongodb+srv://production_user:STRONG_PASSWORD_HERE@cluster.mongodb.net/quickOrderDB?retryWrites=true&w=majority
```

---

### 2. JWT Secret (Random & Unique)

**What You Need:**
- A strong, randomly generated secret key (minimum 32 characters)
- Different from development secret

**Generate One:**
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use a generator: https://www.lastpass.com/features/password-generator
```

**Example:**
```
xK9mL2pQrS5tUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr
```

**Store in Production Environment Variable:**
```
JWT_SECRET=xK9mL2pQrS5tUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr
JWT_EXPIRES_IN=24h
```

---

### 3. SendGrid API Key

**What You Need:**
- SendGrid account (free tier includes 100 emails/day)
- API key for production

**Steps to Create:**
1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for free account
3. Go to Settings → API Keys
4. Create new API key with `Full Access` or at minimum `Mail Send` permission
5. Copy the key (you'll only see it once)

**Example:**
```
SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Store in Production Environment Variable:**
```
SENDGRID_API_KEY=SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
EMAIL_FROM=QuickOrder <noreply@quickorder.com>
EMAIL_FROM_NAME=QuickOrder Team
```

---

### 4. Server Port

**Production Value:**
```
PORT=5001
```

---

### 5. Environment Mode

**Production Value:**
```
NODE_ENV=production
```

---

## Complete Production .env Template

```dotenv
# ==================== DATABASE ====================
MONGO_URI=mongodb+srv://production_user:PASSWORD@cluster.mongodb.net/quickOrderDB?retryWrites=true&w=majority

# ==================== SERVER ====================
PORT=5001
NODE_ENV=production

# ==================== JWT ====================
JWT_SECRET=xK9mL2pQrS5tUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr
JWT_EXPIRES_IN=24h

# ==================== RATE LIMITING ====================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ==================== EMAIL (SendGrid) ====================
SENDGRID_API_KEY=SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
EMAIL_FROM=QuickOrder <noreply@quickorder.com>
EMAIL_FROM_NAME=QuickOrder Team
EMAIL_SERVICE=sendgrid
```

---

## Setting Environment Variables on Your Hosting Platform

### For DigitalOcean App Platform:
1. Go to your app settings
2. Click "Environment"
3. Add each variable from the template above
4. Click "Save"

### For Heroku:
```bash
heroku config:set MONGO_URI="..." JWT_SECRET="..." SENDGRID_API_KEY="..."
```

### For AWS Elastic Beanstalk:
```bash
eb setenv MONGO_URI="..." JWT_SECRET="..." SENDGRID_API_KEY="..."
```

### For Railway:
1. Go to your project
2. Click "Environment"
3. Paste all variables

---

## Security Best Practices

✅ **DO:**
- Generate strong random secrets (minimum 32 characters)
- Use different credentials for each environment (dev, staging, production)
- Store credentials only in environment variables
- Rotate credentials annually or if compromised
- Use MongoDB Atlas IP whitelist
- Monitor SendGrid email logs for suspicious activity

❌ **DON'T:**
- Commit `.env` file to git
- Share credentials via email or chat
- Reuse development credentials in production
- Hardcode credentials in code
- Use simple passwords like "password123"
- Share production credentials with untrusted people

---

## Checking git History

To verify no credentials are in git history:

```bash
# Search for exposed keys
git log -p -S "MONGO_URI" --all
git log -p -S "SENDGRID_API_KEY" --all
git log -p -S "JWT_SECRET" --all
```

---

## If You Accidentally Committed Credentials

### Immediate Actions:
1. **Revoke the compromised credentials immediately:**
   - MongoDB: Delete the user and create a new one
   - SendGrid: Delete the API key and create a new one
   - Git: Force push to remove the commit

2. **Remove from git history:**
   ```bash
   git filter-branch --force --tree-filter 'rm -f .env' -- --all
   git push --force --all
   ```

3. **Update all environment variables** with new credentials

---

## Credential Checklist for Deployment

- [ ] MongoDB production database created with strong password
- [ ] MongoDB connection string obtained and tested
- [ ] JWT secret generated (minimum 32 characters, random)
- [ ] SendGrid account created and API key generated
- [ ] SendGrid sender email configured
- [ ] All credentials added to hosting platform environment
- [ ] Local `.env` file updated with development values only
- [ ] Verified `.env` is in `.gitignore`
- [ ] Verified no credentials in git history
- [ ] Ready to deploy

---

**Last Updated:** November 17, 2025
**Status:** Deployment Security Guide - Complete
