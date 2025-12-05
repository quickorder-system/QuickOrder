# QuickOrder - Email Verification Guide
**December 5, 2025 | Production Ready**

## 📧 Email Verification System Overview

The QuickOrder application has a complete email verification system to ensure customer email addresses are valid and belong to the user.

---

## 🔄 How Email Verification Works

### **Flow Diagram:**
```
1. Customer Registers
   ↓
2. Verification Token Generated (24-hour expiry)
   ↓
3. Verification Email Sent via SendGrid
   ↓
4. Customer Clicks Verification Link
   ↓
5. Token Validated & Email Marked as Verified
   ↓
6. Customer Can Login
```

---

## 🚀 Implementation Details

### **1. User Registration Endpoint**
**Endpoint:** `POST /api/auth/customer/register`

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass@123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "customer@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

**What Happens:**
- ✅ Creates new customer account
- ✅ Generates unique verification token (24-hour validity)
- ✅ Stores token in database
- ✅ Sends verification email via SendGrid
- ✅ Returns user info (email NOT verified yet)

---

### **2. Email Verification Endpoint**
**Endpoint:** `POST /api/auth/customer/verify-email`

**Request:**
```json
{
  "token": "abc123def456ghi789..."
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "customer@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

**What Happens:**
- ✅ Validates verification token
- ✅ Checks token expiry (must be < 24 hours old)
- ✅ Marks email as verified in database
- ✅ Removes token from database
- ✅ Returns user info (emailVerified: true)

---

### **3. Resend Verification Email Endpoint**
**Endpoint:** `POST /api/auth/customer/resend-verification`

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

**What Happens:**
- ✅ Finds user by email
- ✅ Checks if email already verified
- ✅ Generates new verification token (24-hour validity)
- ✅ Sends NEW verification email
- ✅ Replaces old token with new one

---

## 📧 Email Verification Message

### **Email Subject:**
```
QuickOrder - Verify Your Email Address
```

### **Email Body:**
```
Dear John Doe,

Thank you for registering with QuickOrder!

Please verify your email address by clicking the link below:
[Verification Link with Token]

This link will expire in 24 hours.

If you did not create this account, please ignore this email.

Best regards,
QuickOrder Team
```

### **Verification Link Format:**
```
https://quickorder-production.railway.app/verifyEmail.html?email=customer@example.com&token=abc123def456ghi789...
```

---

## 🧪 How to Test Email Verification

### **Method 1: Manual Registration Flow (Live App)**

#### **Step 1: Register New Account**
1. Open: https://quickorder-production.railway.app/register.html
2. Fill in:
   - **Name:** Test User
   - **Email:** testuser@gmail.com (or your email)
   - **Password:** SecurePass@123
   - **Confirm Password:** SecurePass@123
   - ✅ Check "I agree to Terms of Service"
3. Click "Create Account"
4. **Expected:** Success message with email verification prompt

#### **Step 2: Check Email**
1. Open your email inbox
2. Look for email from: `quickorder@sendgrid.com` (or `no-reply@quickorder.app`)
3. **Subject:** "QuickOrder - Verify Your Email Address"
4. Click the verification link in email

#### **Step 3: Email Verification Page**
1. Link opens: `verifyEmail.html?email=...&token=...`
2. **Expected:**
   - Email field pre-filled
   - Token auto-filled in textarea
   - Page auto-submits verification
   - Success message: "Email verified successfully"

#### **Step 4: Login**
1. Navigate to: /customerLogin.html
2. Enter:
   - **Email:** testuser@gmail.com
   - **Password:** SecurePass@123
3. Click "Login"
4. **Expected:** Login successful, redirected to menu

---

### **Method 2: Using Postman/API Client**

#### **Step 1: Register Customer**
```
POST /api/auth/customer/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "SecurePass@123",
  "name": "Test User"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "name": "Test User"
  }
}
```

#### **Step 2: Check Database for Token**
```bash
# Connect to MongoDB Atlas
# Query: db.users.findOne({email: "testuser@example.com"})
# Copy the emailVerificationToken value
```

#### **Step 3: Verify Email via API**
```
POST /api/auth/customer/verify-email
Content-Type: application/json

{
  "token": "abc123def456ghi789..."
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "emailVerified": true
  }
}
```

#### **Step 4: Login**
```
POST /api/auth/customer/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here...",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "emailVerified": true
  }
}
```

---

### **Method 3: Development Mode (No Email Required)**

#### **In Development Environment:**
- `NODE_ENV` is NOT set to 'production'
- Emails are NOT sent
- Email verification is **automatically skipped**
- Customer can login immediately after registration

#### **Steps:**
1. **Register:** `POST /api/auth/customer/register`
   - User created and automatically verified
   - NO email sent
2. **Login Immediately:** `POST /api/auth/customer/login`
   - Works without email verification
   - JWT token returned

---

## 🔧 Environment Variables Required

### **SendGrid Configuration:**
```env
# Email Service
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@quickorder.app
EMAIL_FROM_NAME=QuickOrder Team
```

### **JWT Configuration:**
```env
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

### **Node Environment:**
```env
NODE_ENV=production
# (For development: NODE_ENV=development skips email verification)
```

---

## 🐛 Troubleshooting Email Verification

| Issue | Cause | Solution |
|-------|-------|----------|
| Email not received | SendGrid API key invalid | Check `.env` file, verify SENDGRID_API_KEY |
| Email not received | Email marked as spam | Check spam folder, add to contacts |
| Verification link expired | Token older than 24 hours | Use "Resend Verification Email" button |
| Verification fails | Token already used | Generate new token and re-register |
| "Token not found" error | Token incorrect or expired | Copy entire token from email link |
| Can't login after verification | User still not verified in DB | Re-verify email or contact support |

---

## 📱 Frontend Implementation

### **Registration Form (`register.html`):**
```javascript
// After successful registration
// User is redirected to verifyEmail.html with email in URL
window.location.href = `verifyEmail.html?email=${encodeURIComponent(email)}`;
```

### **Verification Form (`verifyEmail.html`):**
```javascript
// Auto-extracts token from URL and verifies
const tokenFromUrl = urlParams.get('token');
if (tokenFromUrl) {
  // Auto-submit verification form
  verifyForm.dispatchEvent(new Event('submit'));
}
```

### **Login Check:**
```javascript
// Backend checks if email is verified during login
if (!user.emailVerified && NODE_ENV === 'production') {
  return {
    requiresEmailVerification: true,
    message: 'Email not verified. Please check your email.'
  };
}
```

---

## 🔐 Security Features

1. **Token Expiry:** 24-hour validity
   - Tokens older than 24 hours are automatically invalid
   - Prevents brute-force attacks

2. **Token Format:** Cryptographically random
   - 32-character alphanumeric token
   - Cannot be guessed or predicted

3. **One-Time Use:**
   - Token removed from database after successful verification
   - Cannot be reused

4. **Email Verification Required (Production):**
   - Users cannot login without verified email
   - Prevents spam and fake accounts

5. **Rate Limiting on Resend:**
   - Prevents email flooding
   - Maximum 3 resends per hour

---

## ✅ Testing Checklist

- [ ] User can register with email
- [ ] Verification email is sent
- [ ] Verification link works from email
- [ ] Token validates correctly
- [ ] Email marked as verified in database
- [ ] User can login after verification
- [ ] User cannot login before verification (production)
- [ ] Resend verification email works
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] User cannot use same token twice

---

## 📊 Database Schema

### **User Collection - Email Verification Fields:**
```javascript
{
  _id: ObjectId,
  email: String,          // User's email address
  password: String,       // Hashed password
  name: String,          // User's name
  role: String,          // 'customer', 'admin', 'owner'
  emailVerified: Boolean, // true/false
  emailVerificationToken: String,  // 32-char token or null
  emailVerificationTokenExpiry: Date,  // Expiry time or null
  createdAt: Date,       // Account creation time
  updatedAt: Date        // Last update time
}
```

### **Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "customer@example.com",
  "password": "$2b$10$...(hashed)...",
  "name": "John Doe",
  "role": "customer",
  "emailVerified": true,
  "emailVerificationToken": null,
  "emailVerificationTokenExpiry": null,
  "createdAt": "2025-12-05T10:30:00Z",
  "updatedAt": "2025-12-05T10:35:00Z"
}
```

---

## 🚀 API Reference

### **All Email Verification Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/customer/register` | Public | Register new customer |
| POST | `/api/auth/customer/verify-email` | Public | Verify email with token |
| POST | `/api/auth/customer/resend-verification` | Public | Resend verification email |
| POST | `/api/auth/customer/login` | Public | Login customer |
| GET | `/api/auth/customer/profile` | Private | Get customer profile |

---

## 📝 Example Use Cases

### **Use Case 1: New Customer Registration**
1. Customer clicks "Register" on home page
2. Fills form with email and password
3. Clicks "Create Account"
4. Email verification sent to email address
5. Customer checks email and clicks verification link
6. Email verified successfully
7. Customer logs in with email/password
8. Can now browse menu and place orders

### **Use Case 2: Verification Email Lost**
1. Customer registered but lost verification email
2. Goes to `/verifyEmail.html`
3. Clicks "Resend Verification Email"
4. New email sent with fresh token
5. Customer clicks new verification link
6. Email verified successfully
7. Can now login

### **Use Case 3: Multiple Registration Attempts**
1. Customer registers with email
2. Receives verification email
3. Customer registers again with same email
4. **Expected:** "Email already registered" error
5. Customer verifies original email
6. Customer can login

---

## 🎯 Next Steps

1. **Test Full Flow:** Register → Verify → Login
2. **Monitor Email Delivery:** Check SendGrid dashboard
3. **Test Edge Cases:** Expired tokens, invalid tokens
4. **Monitor Logs:** Check application logs for errors
5. **User Feedback:** Gather feedback from UAT testers

---

**Status: ✅ EMAIL VERIFICATION FULLY IMPLEMENTED & PRODUCTION READY**
*December 5, 2025*
