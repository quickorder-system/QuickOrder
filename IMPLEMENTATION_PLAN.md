# Customer Account, Email Verification & Discount Module - Implementation Plan

## Overview
This plan outlines the implementation of a complete customer account system with email verification and discount management for QuickOrder.

---

## Phase 1: Database Schema Updates

### 1.1 Update User Model
**File:** `src/models/user.js`

**Current Issues:**
- Only has `username`, `password`, `role`
- Missing email, email verification, customer profile fields
- No discount tracking

**Updates Needed:**
```javascript
- email (required, unique) - customer email
- emailVerified (boolean) - email verification status
- emailVerificationToken (string) - token for email verification
- emailVerificationExpires (Date) - token expiration time
- firstName (string)
- lastName (string)
- phone (string)
- address (string)
- city (string)
- zipCode (string)
- createdAt (Date) - account creation timestamp
- lastLogin (Date)
- accountStatus (active/suspended/deleted)
```

### 1.2 Create Discount Model
**File:** `src/models/discount.js` (NEW)

**Fields:**
```javascript
- code (string) - discount code (e.g., "WELCOME10", "SUMMER20")
- discountType (enum) - "percentage" or "fixed"
- discountValue (number) - 10 (for 10%) or 500 (for ₱500)
- minOrderAmount (number) - minimum order value to apply discount
- maxUsagePerCustomer (number) - how many times a customer can use
- maxTotalUsage (number) - total usage limit across all customers
- currentUsage (number) - current usage count
- startDate (Date)
- endDate (Date)
- isActive (boolean)
- applicableItems (array) - specific item IDs if limited, empty = all items
- description (string)
- createdAt (Date)
- createdBy (ObjectId) - admin/owner who created it
```

### 1.3 Create CustomerDiscount Model
**File:** `src/models/customerDiscount.js` (NEW)

**Fields:**
```javascript
- customerId (ObjectId) - reference to customer
- discountId (ObjectId) - reference to discount
- usageCount (number) - how many times this customer used this discount
- isUsed (boolean) - is currently in use on pending/processing order
- appliedToOrderId (ObjectId) - which order this discount is applied to
- createdAt (Date)
```

---

## Phase 2: UI/UX Changes & Page Restructuring

### 2.1 Homepage Flow Changes
**Current Flow:**
- Home.html → QuickOrder.html (menu browsing)
- OR Home.html → Login.html (admin/owner login)

**New Flow:**
- Home.html → **Customer Login/Register** → QuickOrder.html (menu) → Cart → Checkout
- Home.html → **Admin/Owner Login** → Admin.html/Owner.html

**Changes:**
1. **Home.html** remains as landing page but modified:
   - Change "Get Started" button to lead to **Customer Login/Register Modal**
   - Keep separate "Admin Login" link/button
   - Remove direct QuickOrder.html link

2. **Login.html** - Keep as is but rename/repurpose:
   - Rename to `AdminLogin.html` for clarity
   - Add role-based detection at login

### 2.2 New Pages/Components to Create

#### A. **CustomerAuth.html** (NEW) - Main Customer Authentication Page
```
- Two Tabs: "Sign In" | "Sign Up"
- Sign In Tab:
  * Email field
  * Password field
  * "Remember me" checkbox
  * "Forgot Password?" link
  
- Sign Up Tab:
  * Email field
  * Password field
  * Confirm Password field
  * First Name field
  * Last Name field
  * Phone field
  * Address field
  * City field
  * Zip Code field
  * Terms & Conditions checkbox
  * "Sign Up" button
  * Already have account? → switches to Sign In tab
```

#### B. **EmailVerification.html** (NEW)
```
- Message: "Please verify your email to continue"
- Email display (masked): "use***@example.com"
- OTP Input field (4-6 digit code)
- Resend OTP link (with cooldown timer)
- Back to login link
```

#### C. **CustomerDashboard.html** (NEW)
```
- Sidebar Navigation:
  * Dashboard/Home
  * My Orders
  * My Discounts/Coupons
  * Account Settings
  * Logout

- Main Content Area:
  * Welcome message
  * Quick links to browse menu
  * Recent orders
  * Available discounts
  * Account balance/loyalty points (future)
```

#### D. **CustomerOrders.html** (NEW) - Order History
```
- Order List with status badges:
  * Pending
  * Confirmed
  * Preparing
  * Ready
  * Delivered
  * Cancelled
  
- For each order:
  * Order ID
  * Date/Time
  * Items ordered
  * Total amount
  * Status with timestamp
  * Reorder button
  * View details button (expand)
```

#### E. **CustomerMyDiscounts.html** (NEW)
```
- List of available discounts for customer:
  * Discount code
  * Description
  * Discount amount (10% off, ₱500 off, etc)
  * Min order amount requirement
  * Expiry date
  * Copy code button
  * Apply button (for active cart)
  * Usage count (X/Y times used)
  * Status badge (Active/Expired/Exhausted)
  
- Section: Discounts Applied to Account
  * Tracking of discounts assigned to this customer
```

#### F. **CustomerAccountSettings.html** (NEW)
```
- Tabs:
  1. Profile Information
     - First Name, Last Name
     - Email (read-only, with verify button if not verified)
     - Phone
     - Address
     - City
     - Zip Code
     - Edit / Cancel / Save buttons

  2. Password & Security
     - Current Password field
     - New Password field
     - Confirm New Password field
     - Change Password button

  3. Preferences
     - Email notifications toggle
     - SMS notifications toggle
     - Marketing emails toggle

  4. Logout
     - Logout all devices button
     - Logout current session button
```

### 2.3 QuickOrder.html Modifications
```
- Move authentication check to top (redirect if not logged in)
- Add user profile section in navbar:
  * User avatar/initial
  * Dropdown menu with:
    - My Account
    - My Orders
    - My Discounts
    - Settings
    - Logout

- Add "Apply Discount Code" section in:
  1. Menu browsing area (discount banner)
  2. Cart sidebar (before checkout)
  3. Checkout page

- Discount Display:
  * Show applicable discounts based on cart items
  * Allow manual coupon code input
  * Show savings amount
  * Show discount details on hover
```

### 2.4 Pages to KEEP (No Removal Needed)
- **Home.html** - Landing page (modify, not remove)
- **QuickOrder.html** - Menu & ordering (enhance with auth)
- **Admin.html** - Admin management
- **Owner.html** - Owner management
- **Receipt.html** - Order receipt
- **menu.html** - Menu display (component)

### 2.5 Pages to DEPRECATE/REDIRECT
- **Login.html** - Rename to AdminLogin.html OR modify to detect role
- Consider removing direct access, use redirects based on role

---

## Phase 3: Backend API Endpoints

### 3.1 Authentication Routes (`src/routes/auth.js` - Modifications)
```
Existing:
- POST /api/auth/login (keep for admin/owner, or adapt)
- POST /api/auth/logout

New Customer Routes:
- POST /api/auth/register - Register new customer
- POST /api/auth/send-verification-email - Send OTP/verification email
- POST /api/auth/verify-email - Verify OTP and activate account
- POST /api/auth/resend-verification - Resend verification email
- POST /api/auth/forgot-password - Initiate password reset
- POST /api/auth/reset-password - Complete password reset
- GET /api/auth/customer-profile - Get logged-in customer profile
- PUT /api/auth/customer-profile - Update customer profile
```

### 3.2 Customer Routes (NEW: `src/routes/customers.js`)
```
- GET /api/customers/me - Get current customer profile
- PUT /api/customers/me - Update profile
- GET /api/customers/orders - Get customer's orders
- GET /api/customers/orders/:id - Get specific order
- POST /api/customers/orders/:id/reorder - Reorder items
```

### 3.3 Discount Routes (NEW: `src/routes/discounts.js`)
```
- GET /api/discounts - Get all active discounts (for customers)
- GET /api/discounts/validate - Validate discount code
- POST /api/discounts/apply - Apply discount to order
- GET /api/discounts/my-discounts - Get customer's assigned discounts
- GET /api/discounts/applicable - Get discounts applicable to current cart
- POST /api/discounts/admin - Create discount (admin only)
- PUT /api/discounts/admin/:id - Edit discount (admin only)
- DELETE /api/discounts/admin/:id - Delete discount (admin only)
- GET /api/discounts/admin/list - List all discounts (admin)
```

### 3.4 Email Service Enhancement (`src/services/email.service.js`)
```
New Functions:
- sendVerificationEmail(email, token, otp)
- sendPasswordResetEmail(email, resetLink)
- sendOrderConfirmationEmail(email, orderDetails)
- sendOrderStatusUpdateEmail(email, orderDetails, status)
- sendDiscountNotificationEmail(email, discountDetails)
```

---

## Phase 4: Frontend JavaScript Files

### 4.1 New Services
- `public/js/services/auth.service.js` - Customer authentication
- `public/js/services/customer.service.js` - Customer profile & orders
- `public/js/services/discount.service.js` - Discount management

### 4.2 New Components
- `public/js/components/customerAuth.component.js` - Auth modal/page
- `public/js/components/emailVerification.component.js` - Email verification
- `public/js/components/discountBrowser.component.js` - Discount list
- `public/js/components/discountApplier.component.js` - Apply discount to cart

### 4.3 Modified Files
- `public/js/QuickOrder.js` - Add auth check, discount integration
- `public/js/menu.js` - Add discount filtering
- `public/js/components/cart.component.js` - Add discount application
- `public/js/services/api.service.js` - Add customer endpoints

---

## Phase 5: Activity Logging Integration

### 5.1 New Activity Types to Log
```
- CUSTOMER_REGISTERED
- EMAIL_VERIFIED
- DISCOUNT_APPLIED
- DISCOUNT_CREATED (by admin/owner)
- CUSTOMER_ACCOUNT_UPDATED
- PASSWORD_CHANGED
- ORDER_PLACED_BY_CUSTOMER
```

### 5.2 Update activityLogger.js
- Add customer-specific logging functionality
- Log discount application to orders

---

## Implementation Sequence

### Sprint 1: Core Infrastructure
1. Update User model with customer fields
2. Create Discount & CustomerDiscount models
3. Create email verification service
4. Create discount service endpoints

### Sprint 2: Authentication UI & Logic
1. Create CustomerAuth.html
2. Create EmailVerification.html
3. Implement customer registration/login services
4. Update API authentication endpoints

### Sprint 3: Customer Dashboard
1. Create CustomerDashboard.html
2. Create CustomerOrders.html
3. Create CustomerAccountSettings.html
4. Add customer profile APIs

### Sprint 4: Discount Module
1. Create CustomerMyDiscounts.html
2. Implement discount validation logic
3. Integrate discounts into QuickOrder.html
4. Create admin discount management UI

### Sprint 5: Integration & Polish
1. Update QuickOrder.html with auth checks
2. Add discount indicators to menu
3. Integrate discounts into cart & checkout
4. Complete activity logging

---

## Security Considerations

1. **Email Verification:**
   - Use OTP/token-based verification
   - Set expiration time (15 minutes)
   - Rate limit email sending (prevent abuse)
   - Resend limit (5 times per hour)

2. **Password Security:**
   - Hash all passwords with bcrypt (already done)
   - Enforce strong password requirements
   - Implement password reset with token

3. **Discount Security:**
   - Validate discount code backend (not just frontend)
   - Track usage limits per customer
   - Prevent code duplication/exploitation
   - Log all discount applications

4. **Customer Data:**
   - Verify customer ownership of data (JWT + user ID match)
   - Mask sensitive info in logs
   - GDPR compliance for data handling

---

## Pages/Sections Summary

### Pages to REMOVE: **NONE** (adapt existing)

### Pages to MODIFY:
- Home.html → Add customer auth modal
- QuickOrder.html → Add auth check, discounts
- Login.html → Rename to AdminLogin.html OR enhance with role detection

### Pages to CREATE:
1. CustomerAuth.html
2. EmailVerification.html
3. CustomerDashboard.html
4. CustomerOrders.html
5. CustomerMyDiscounts.html
6. CustomerAccountSettings.html

### Modal Components to ADD:
1. Discount selection modal
2. Discount details modal
3. Profile update modal

---

## Database Schema Summary

**New Collections:**
- `discounts` - Discount codes and rules
- `customerdiscounts` - Customer-discount relationships (mapping)

**Modified Collections:**
- `users` - Extended with customer fields

**Existing Collections (No Change):**
- `orders`
- `inventory`
- `activitylogs`

---

## Key Features

✅ Customer Registration with email verification
✅ Customer Login/Logout
✅ Customer Profile Management
✅ Order History & Reorder
✅ Discount Code Management
✅ Discount Application to Orders
✅ Email Notifications
✅ Activity Logging for all actions
✅ Admin Discount Management
✅ Role-Based Access Control

---

## Timeline Estimate

- **Total Duration:** 3-4 weeks
- **Sprint 1 (Backend):** 5-6 days
- **Sprint 2 (Auth UI):** 5-6 days
- **Sprint 3 (Dashboard):** 5-6 days
- **Sprint 4 (Discounts):** 5-6 days
- **Sprint 5 (Integration):** 3-4 days
- **Testing & Bug Fixes:** 3-4 days

