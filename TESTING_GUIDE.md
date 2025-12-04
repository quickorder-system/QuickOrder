# QuickOrder Testing Guide - Phases 1-4

**Last Updated:** December 5, 2025  
**Status:** Complete Testing Infrastructure Ready

---

## 🧪 Testing Overview

This guide covers testing all implemented phases:
- **Phase 1:** Project Setup & Infrastructure
- **Phase 2:** Menu & Ordering System
- **Phase 3:** Customer Dashboard Frontend
- **Phase 4:** Customer Backend APIs

---

## 📋 Prerequisites

### Required Software
```bash
- Node.js v16+ (https://nodejs.org/)
- MongoDB v5.0+ (local or cloud)
- Git
- Postman or similar API testing tool (optional)
```

### Installation
```bash
# Clone the repository
git clone https://github.com/quickorder-system/QuickOrder.git
cd QuickOrder

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

---

## 🔧 Environment Setup

### Configure .env File
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/quickorder

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Email (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# Application
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000/public
```

### MongoDB Setup

**Option 1: Local MongoDB**
```bash
# Windows
# Download from: https://www.mongodb.com/try/download/community
# Run MongoDB Service
net start MongoDB

# Test connection
mongo
```

**Option 2: MongoDB Atlas (Cloud)**
```bash
# 1. Create account at https://www.mongodb.com/cloud/atlas
# 2. Create cluster
# 3. Get connection string
# 4. Update MONGODB_URI in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickorder
```

---

## 🚀 Running the Application

### Start Development Server
```bash
# Terminal 1: Start backend server
npm start

# Expected output:
# Server running on port 5000
# Connected to MongoDB at mongodb://localhost:27017/quickorder
```

### Access the Application
```bash
# Frontend (Menu)
http://localhost:5000/public/menu.html

# Admin Login
http://localhost:5000/public/Login.html

# Customer Dashboard
http://localhost:5000/public/customerDashboard.html

# Customer Login
http://localhost:5000/public/customerLogin.html
```

---

## 🧪 Phase 1 Testing: Project Setup

### Verify Installation
```bash
# Check Node version
node -v

# Check npm version
npm -v

# Check git
git status

# Check dependencies installed
npm list
```

### Test Server Startup
```bash
# Start server
npm start

# Expected in console:
# ✅ Server running on port 5000
# ✅ Connected to MongoDB
# ✅ Logger initialized
```

### Test Database Connection
```bash
# In MongoDB client:
use quickorder
db.users.count()

# Should return: 0 (or existing documents)
```

### Test API Health Check
```bash
# In browser or curl:
GET http://localhost:5000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-05T10:00:00Z"
}
```

---

## 🍕 Phase 2 Testing: Menu & Ordering System

### Manual Testing - Menu Page

1. **Open Menu Page**
   ```
   http://localhost:5000/public/menu.html
   ```

2. **Test Menu Display**
   - [ ] All menu categories visible
   - [ ] Items loaded with images
   - [ ] Prices displayed correctly
   - [ ] Item descriptions shown

3. **Test Add to Cart**
   - [ ] Click "Add to Cart" button
   - [ ] Item appears in cart
   - [ ] Quantity can be increased/decreased
   - [ ] Price updates correctly

4. **Test Cart Operations**
   - [ ] Remove item from cart
   - [ ] Clear entire cart
   - [ ] Cart totals calculated correctly
   - [ ] Persistent across page reload

5. **Test Order Placement**
   - [ ] Click "Place Order"
   - [ ] Order confirmation appears
   - [ ] Receipt displays correct items
   - [ ] Order ID generated

### API Testing - Menu Endpoints

```bash
# Using curl or Postman

# 1. Get All Categories
GET http://localhost:5000/api/inventory/categories

# Expected: Array of category objects

# 2. Get Items by Category
GET http://localhost:5000/api/inventory/items?category=appetizers

# Expected: Array of menu items

# 3. Get Single Item
GET http://localhost:5000/api/inventory/items/[item_id]

# Expected: Single item with details
```

### Test Data Setup

```bash
# Insert test data via Postman POST request
POST http://localhost:5000/api/inventory/items

Body (JSON):
{
  "name": "Spaghetti Carbonara",
  "category": "pasta",
  "price": 350,
  "description": "Creamy Italian pasta",
  "image": "/images/carbonara.jpg",
  "available": true
}
```

---

## 👤 Phase 3 Testing: Customer Dashboard Frontend

### Manual Testing - Customer Registration & Login

1. **Register New Customer**
   ```
   URL: http://localhost:5000/public/customerLogin.html
   ```
   - [ ] Click "Sign up here" link
   - [ ] Fill registration form
   - [ ] Submit registration
   - [ ] Verify success message
   - [ ] Check email for verification link

2. **Verify Email**
   - [ ] Check sent emails (check .env EMAIL_USER inbox)
   - [ ] Click verification link or enter token
   - [ ] Email should be marked verified

3. **Login to Dashboard**
   ```
   URL: http://localhost:5000/public/customerLogin.html
   ```
   - [ ] Enter email and password
   - [ ] Redirect to customer dashboard
   - [ ] User name displayed correctly

### Manual Testing - Customer Dashboard

1. **Dashboard Page** (`customerDashboard.html`)
   - [ ] Welcome message displays user name
   - [ ] Quick stats cards visible (Total Orders, Pending, etc.)
   - [ ] Recent orders preview shown
   - [ ] Navigation menu accessible

2. **Profile Page** (`customerProfile.html`)
   - [ ] Current profile information displayed
   - [ ] Can edit name, phone, preferences
   - [ ] Can add delivery address
   - [ ] Can set default address
   - [ ] Can change password
   - [ ] Changes saved successfully

3. **Order History Page** (`orderHistory.html`)
   - [ ] All orders displayed
   - [ ] Pagination working
   - [ ] Filter by status works
   - [ ] Click order to view details
   - [ ] Order details modal displays items and total

### Frontend Testing Checklist

```javascript
// Test in browser console:

// 1. Check authentication
authService.isAuthenticated()  // Should return: true

// 2. Check user data
authService.getUser()  // Should show user object

// 3. Check token
authService.getToken()  // Should return: JWT token

// 4. Check localStorage
localStorage.getItem('authToken')  // Should have token
localStorage.getItem('user')       // Should have user data
```

### Test with Browser DevTools

**Network Tab:**
- [ ] All API calls successful (200 status)
- [ ] No failed requests (4xx, 5xx)
- [ ] Response times < 1 second

**Console Tab:**
- [ ] No JavaScript errors
- [ ] No console warnings

**Storage Tab:**
- [ ] AuthToken stored in localStorage
- [ ] User data stored correctly

---

## 🔌 Phase 4 Testing: Customer Backend APIs

### Setup Test Environment

```bash
# Install test dependencies (if not already done)
npm install --save-dev jest supertest

# Run tests
npm test

# Run specific test file
npm test tests/phase4.api.test.js
```

### Manual API Testing with Postman

#### 1. Authentication Endpoints

**Register Customer**
```http
POST http://localhost:5000/api/auth/customer/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "password123",
  "name": "Test User"
}

Expected Response (201):
{
  "message": "Registration successful...",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "customer"
  }
}
```

**Verify Email**
```http
POST http://localhost:5000/api/auth/customer/verify-email
Content-Type: application/json

{
  "token": "[verification_token_from_email]"
}

Expected Response (200):
{
  "message": "Email verified successfully",
  "user": { ... }
}
```

**Login**
```http
POST http://localhost:5000/api/auth/customer/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "password123"
}

Expected Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### 2. Profile Endpoints

**Get Profile** (Requires Auth Token)
```http
GET http://localhost:5000/api/customers/profile
Authorization: Bearer [your_token]
x-auth-token: [your_token]

Expected Response (200):
{
  "_id": "...",
  "email": "testuser@example.com",
  "name": "Test User",
  "phone": null,
  "preferences": { ... }
}
```

**Update Profile**
```http
PUT http://localhost:5000/api/customers/profile
Authorization: Bearer [your_token]
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890",
  "preferences": {
    "notifications": true,
    "marketingEmails": false
  }
}

Expected Response (200):
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

**Change Password**
```http
POST http://localhost:5000/api/customers/change-password
Authorization: Bearer [your_token]
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}

Expected Response (200):
{
  "message": "Password changed successfully"
}
```

#### 3. Address Management Endpoints

**Get All Addresses**
```http
GET http://localhost:5000/api/customers/addresses
Authorization: Bearer [your_token]

Expected Response (200):
{
  "addresses": []
}
```

**Add Address**
```http
POST http://localhost:5000/api/customers/addresses
Authorization: Bearer [your_token]
Content-Type: application/json

{
  "label": "home",
  "street": "123 Main St",
  "city": "Manila",
  "postalCode": "1234",
  "phone": "+1234567890"
}

Expected Response (201):
{
  "message": "Address added successfully",
  "address": {
    "_id": "...",
    "label": "home",
    "street": "123 Main St",
    "city": "Manila",
    "postalCode": "1234",
    "phone": "+1234567890",
    "isDefault": true,
    "createdAt": "..."
  }
}
```

**Update Address**
```http
PUT http://localhost:5000/api/customers/addresses/[address_id]
Authorization: Bearer [your_token]
Content-Type: application/json

{
  "street": "456 New St",
  "city": "Quezon City",
  "postalCode": "5678",
  "phone": "+0987654321"
}

Expected Response (200):
{
  "message": "Address updated successfully",
  "address": { ... }
}
```

**Set Default Address**
```http
PUT http://localhost:5000/api/customers/addresses/[address_id]/default
Authorization: Bearer [your_token]

Expected Response (200):
{
  "message": "Default address set successfully",
  "address": {
    "isDefault": true,
    ...
  }
}
```

**Delete Address**
```http
DELETE http://localhost:5000/api/customers/addresses/[address_id]
Authorization: Bearer [your_token]

Expected Response (200):
{
  "message": "Address deleted successfully"
}
```

#### 4. Order Endpoints

**Get Orders**
```http
GET http://localhost:5000/api/customers/orders
Authorization: Bearer [your_token]

Query Parameters:
?page=1&limit=10&status=completed

Expected Response (200):
{
  "orders": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Get Order Details**
```http
GET http://localhost:5000/api/customers/orders/[order_id]
Authorization: Bearer [your_token]

Expected Response (200):
{
  "_id": "...",
  "customerId": "...",
  "items": [ ... ],
  "totalAmount": 2500,
  "status": "completed",
  "createdAt": "..."
}
```

#### 5. Logout**
```http
POST http://localhost:5000/api/auth/customer/logout
Authorization: Bearer [your_token]

Expected Response (200):
{
  "message": "Logout successful"
}
```

### Automated Testing with Jest

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test tests/phase4.api.test.js

# Run in watch mode
npm test -- --watch

# Expected output:
# PASS tests/phase4.api.test.js
#   Phase 4 Backend Integration Tests
#     Authentication Endpoints
#       POST /api/auth/customer/register
#         ✓ should register a new customer
#         ✓ should fail with missing fields
#       POST /api/auth/customer/login
#         ✓ should login successfully
#         ...
#     40+ tests PASSED
```

### Test Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## 🔍 Common Testing Scenarios

### Scenario 1: Complete Customer Journey

```
1. Register new customer account
   ↓
2. Verify email address
   ↓
3. Login to dashboard
   ↓
4. View profile
   ↓
5. Add delivery address
   ↓
6. View order history
   ↓
7. Update profile information
   ↓
8. Change password
   ↓
9. Logout
```

### Scenario 2: Address Management

```
1. Add home address
   ↓
2. Add work address
   ↓
3. Set work as default
   ↓
4. Update home address
   ↓
5. View all addresses
   ↓
6. Delete home address
```

### Scenario 3: Error Handling

```
1. Register with existing email → Should fail
2. Login with wrong password → Should fail
3. Access profile without token → Should fail
4. Update address with missing fields → Should fail
5. Delete non-existent address → Should fail
```

---

## 📊 Testing Checklist

### Phase 1 ✅
- [ ] Server starts successfully
- [ ] MongoDB connection established
- [ ] API health check returns 200
- [ ] Environment variables loaded

### Phase 2 ✅
- [ ] Menu items display correctly
- [ ] Add to cart functionality works
- [ ] Cart calculations correct
- [ ] Order placement successful

### Phase 3 ✅
- [ ] Customer registration working
- [ ] Email verification functioning
- [ ] Dashboard page displays correctly
- [ ] Profile management works
- [ ] Address management UI functional
- [ ] Order history displays correctly

### Phase 4 ✅
- [ ] All authentication endpoints working
- [ ] Profile endpoints functional
- [ ] Address CRUD operations successful
- [ ] Order endpoints returning data
- [ ] Error handling proper
- [ ] All 40+ tests passing

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process on port 5000
taskkill /PID [PID] /F

# Try different port
PORT=5001 npm start
```

### MongoDB Connection Failed
```bash
# Check MongoDB service
Get-Service MongoDB

# Start MongoDB
Start-Service MongoDB

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/quickorder
```

### Tests Failing
```bash
# Clear jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Check test file syntax
npm test -- --detectOpenHandles
```

### Email Not Sending
```bash
# Verify email credentials in .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# For Gmail: Generate App Password
# 1. Go to https://myaccount.google.com/apppasswords
# 2. Select Mail and Windows Computer
# 3. Use generated 16-char password

# Alternative: Use SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

---

## 🎯 Quick Start Testing Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start MongoDB (if local)
net start MongoDB

# 4. Start server
npm start

# 5. In another terminal, run tests
npm test

# 6. In browser, visit:
# Menu: http://localhost:5000/public/menu.html
# Register: http://localhost:5000/public/customerLogin.html
# Dashboard: http://localhost:5000/public/customerDashboard.html
```

---

## 📞 Getting Help

### Check Logs
```bash
# Server logs show in console
# Check for errors and warnings

# MongoDB logs
# Windows: Event Viewer
# Mac/Linux: /var/log/mongodb.log
```

### Debug Mode
```bash
# Run with debug output
DEBUG=* npm start

# Or specific module
DEBUG=express:* npm start
```

### Test Individual Endpoints
```javascript
// In browser console while on any page:

// Test registration
fetch('/api/auth/customer/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  })
}).then(r => r.json()).then(console.log)

// Test get profile
fetch('/api/customers/profile', {
  headers: { 'x-auth-token': localStorage.getItem('authToken') }
}).then(r => r.json()).then(console.log)
```

---

## ✅ Success Indicators

**Phase 1-2 Working:**
- Server runs without errors
- Menu loads in browser
- Can add items to cart
- Order can be placed

**Phase 3 Working:**
- Can register and verify email
- Dashboard displays user info
- Profile can be updated
- Addresses can be managed
- Order history shows orders

**Phase 4 Working:**
- All API tests pass
- Authentication endpoints work
- CRUD operations successful
- No console errors
- Response times < 1 second

---

**Status:** ✅ Ready for Testing

**Next Step:** Follow the testing guide above, then report any issues or proceed to Phase 5!
