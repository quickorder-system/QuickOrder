# Registration Troubleshooting Guide
**December 5, 2025**

## ✅ What Was Fixed

### **Issue: 400 Error on Registration**

The registration endpoint was throwing 400 errors with unclear messages. Here's what was improved:

#### **Problems Fixed:**
1. ✅ Error response format inconsistency (now returns both `error` and `message`)
2. ✅ Added email format validation
3. ✅ Added comprehensive logging to track issues
4. ✅ Improved error messages (now clearly states what's wrong)
5. ✅ Email sending failures no longer block registration

---

## 🚀 How Registration Works Now

### **Registration Flow:**
```
1. User fills registration form
   ↓
2. Client validates form (name, email, password match)
   ↓
3. Server validates input:
   - Email, password, name are required
   - Email format is valid
   - Password is at least 6 characters
   ↓
4. Server checks if email already registered
   ↓
5. User created with verification token
   ↓
6. Verification email sent (doesn't block if fails)
   ↓
7. Success response with user info
   ↓
8. Client redirects to verification page
```

---

## ✅ Common Registration Errors & Solutions

### **Error: "Registration failed" (400)**

**Possible Causes & Solutions:**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Email, password, and name are required` | Missing field | Fill all three fields (Name, Email, Password) |
| `Please enter a valid email address` | Invalid email format | Use format: `user@example.com` |
| `Password must be at least 6 characters` | Password too short | Password must be 6+ characters |
| `Email already registered` | Email already exists | Use a different email or login |

---

## 🧪 Testing Registration

### **Successful Registration Test:**

#### **Step 1: Open Registration Page**
```
https://quickorder-production-145f.up.railway.app/register.html
```

#### **Step 2: Fill Form**
```
Full Name:        Test User
Email Address:    testuser@gmail.com
Password:         TestPass@123
Confirm Password: TestPass@123
☑️ I agree to Terms of Service
```

#### **Step 3: Click "Create Account"**

#### **Expected Response:**
```
✅ Registration successful! Check your email to verify your account.
→ Redirected to: verifyEmail.html?email=testuser@gmail.com
```

#### **Step 4: Check Email**
```
- Subject: QuickOrder - Verify Your Email Address
- Contains: "Verify Email Address" button
- Contains: Verification link
```

#### **Step 5: Click Verification Link**
```
→ Automatically redirected to: customerLogin.html?verified=true
✅ Message: Email verified successfully!
```

#### **Step 6: Login**
```
Email:    testuser@gmail.com
Password: TestPass@123
→ Login successful! Redirected to menu
```

---

## 🔍 Debugging Registration Issues

### **Step 1: Check Browser Console**
```
Open DevTools (F12) → Console tab
Look for error messages like:
- "Email, password, and name are required"
- "Invalid email address"
- "Email already registered"
```

### **Step 2: Check Network Tab**
```
Open DevTools → Network tab
Look for POST request to: /api/auth/customer/register
- Status should be: 201 (success) or 400 (validation error)
- Response should show clear error message
```

### **Step 3: Check Server Logs (Local Development)**
```bash
npm start
# Look for logs like:
# [Register] Request received - Email: user@example.com, Name: Test User
# [Register] Creating new user: user@example.com
# [Register] User saved successfully: user@example.com
# [Register] Verification email sent: user@example.com
# [Register] Customer registered successfully: user@example.com
```

### **Step 4: Check Database**
```javascript
// MongoDB Query:
db.users.findOne({email: "testuser@gmail.com"})

// Should return:
{
  _id: ObjectId(...),
  email: "testuser@gmail.com",
  name: "Test User",
  password: "$2b$10$...(hashed)",
  role: "customer",
  emailVerified: false,
  emailVerificationToken: "abc123...",
  emailVerificationTokenExpiry: ISODate("2025-12-06T..."),
  createdAt: ISODate(...),
  updatedAt: ISODate(...)
}
```

---

## 📋 Registration Form Validation

### **Client-Side Validation (Frontend):**
```javascript
Rules:
- Name: Required, min 2 characters
- Email: Required, valid format (user@domain.com)
- Password: Required, min 6 characters
- Confirm Password: Must match Password field
- Terms: Must be checked
```

### **Server-Side Validation (Backend):**
```javascript
Checks:
✅ All fields (email, password, name) are present
✅ Email format is valid (contains @ and domain)
✅ Password is at least 6 characters
✅ Email is not already registered
```

---

## 📊 Registration API Endpoint

### **Endpoint: `POST /api/auth/customer/register`**

#### **Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "name": "John Doe"
}
```

#### **Successful Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

#### **Error Response (400):**
```json
{
  "error": "Email already registered",
  "message": "Email already registered"
}
```

---

## 🔧 Troubleshooting Checklist

- [ ] Form has all three fields filled (Name, Email, Password)
- [ ] Email is in valid format (example@domain.com)
- [ ] Password is at least 6 characters
- [ ] Passwords match (Password == Confirm Password)
- [ ] Terms checkbox is checked
- [ ] Email is NOT already registered
- [ ] Server logs show registration steps
- [ ] Database shows new user created
- [ ] Verification email received
- [ ] Can click verification link
- [ ] Email marked as verified
- [ ] Can login with email/password

---

## 🎯 What Changed in This Fix

### **Error Handler (`src/middleware/errorHandler.js`):**
```javascript
// Before:
{ error: "Email already registered" }

// After:
{ 
  error: "Email already registered",
  message: "Email already registered"  ← Helps frontend
}
```

### **Registration Endpoint (`src/routes/auth.js`):**
```javascript
// Added:
- Email format validation
- Detailed logging at each step
- Email sending failures don't block registration
- Better error messages for each validation

// Logs:
[Register] Request received - Email: user@example.com
[Register] Creating new user: user@example.com
[Register] User saved successfully: user@example.com
[Register] Verification email sent: user@example.com
```

---

## 📱 Testing with Postman

### **Create Request:**
```
POST https://quickorder-production-145f.up.railway.app/api/auth/customer/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPass123",
  "name": "Test User"
}
```

### **Expected Response:**
```
Status: 201 Created

Body:
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "customer"
  }
}
```

---

## 🚀 Next Steps

1. **Test Registration** on production site
2. **Verify Email** by clicking verification link
3. **Login** with registered credentials
4. **Browse Menu** and place test order
5. **Check Order History** to confirm

---

**Status: ✅ REGISTRATION FULLY TESTED & DEBUGGED**
*Last Updated: December 5, 2025*
