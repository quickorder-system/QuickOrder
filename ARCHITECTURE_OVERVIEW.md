# Customer Account & Discount Module - Architecture Overview

## Current System Flow vs New System Flow

### CURRENT FLOW
```
Home.html
  ├─→ Admin/Owner Login → Login.html → Admin.html / Owner.html
  └─→ Browse Menu → QuickOrder.html → Menu → Cart → Receipt
```

### NEW FLOW
```
Home.html (modified - Landing Page)
  ├─→ Admin/Owner Login → AdminLogin.html → Admin.html / Owner.html
  │   
  └─→ Customer Journey:
      1. CustomerAuth.html (Sign Up / Sign In)
         ├─→ New Customer: Registration Form
         │   └─→ EmailVerification.html (OTP verification)
         │
         └─→ Existing Customer: Login
             └─→ QuickOrder.html (Menu + Discounts)
                 ├─→ Apply Discount Code
                 ├─→ Add Items to Cart
                 ├─→ Checkout
                 └─→ Receipt.html
                 
      2. CustomerDashboard.html (Account Hub)
         ├─→ CustomerOrders.html (Order History)
         ├─→ CustomerMyDiscounts.html (Available Coupons)
         ├─→ CustomerAccountSettings.html (Profile)
         └─→ Logout
```

---

## Database Schema Changes

### USER MODEL (Enhanced)
```
Current:
├── username
├── password
└── role (admin, owner, customer)

NEW FIELDS:
├── email (unique, required for customers)
├── emailVerified (boolean)
├── emailVerificationToken
├── emailVerificationExpires
├── firstName
├── lastName
├── phone
├── address
├── city
├── zipCode
├── createdAt
├── lastLogin
└── accountStatus (active/suspended/deleted)
```

### NEW: DISCOUNT MODEL
```
{
  code: "WELCOME10",
  discountType: "percentage" | "fixed",
  discountValue: 10 | 500,
  minOrderAmount: 1000,
  maxUsagePerCustomer: 3,
  maxTotalUsage: 100,
  currentUsage: 45,
  startDate: Date,
  endDate: Date,
  isActive: boolean,
  applicableItems: [], (empty = all items)
  description: "10% off on first order",
  createdAt: Date,
  createdBy: ObjectId (admin)
}
```

### NEW: CUSTOMER DISCOUNT MODEL
```
{
  customerId: ObjectId,
  discountId: ObjectId,
  usageCount: 1,
  isUsed: false,
  appliedToOrderId: ObjectId,
  createdAt: Date
}
```

---

## New API Endpoints

### Customer Authentication
```
POST   /api/auth/register                  - Register new customer
POST   /api/auth/send-verification-email   - Send OTP email
POST   /api/auth/verify-email              - Verify OTP
POST   /api/auth/resend-verification       - Resend OTP
POST   /api/auth/forgot-password           - Start password reset
POST   /api/auth/reset-password            - Complete password reset
GET    /api/auth/customer-profile          - Get profile
PUT    /api/auth/customer-profile          - Update profile
```

### Customer Data
```
GET    /api/customers/me                   - Current customer profile
PUT    /api/customers/me                   - Update profile
GET    /api/customers/orders               - Order history
GET    /api/customers/orders/:id           - Specific order
POST   /api/customers/orders/:id/reorder   - Reorder items
```

### Discount Management (Customer)
```
GET    /api/discounts                      - All active discounts
GET    /api/discounts/validate             - Validate code
POST   /api/discounts/apply                - Apply to order
GET    /api/discounts/my-discounts         - Customer's discounts
GET    /api/discounts/applicable           - Discounts for cart items
```

### Discount Management (Admin)
```
POST   /api/discounts/admin                - Create discount
PUT    /api/discounts/admin/:id            - Edit discount
DELETE /api/discounts/admin/:id            - Delete discount
GET    /api/discounts/admin/list           - All discounts (admin view)
```

---

## UI Components & Pages

### NEW PAGES (6 Total)
```
1. CustomerAuth.html
   - Sign In Tab
   - Sign Up Tab
   - Password recovery link
   
2. EmailVerification.html
   - OTP input
   - Resend button with timer
   - Back to login
   
3. CustomerDashboard.html
   - Sidebar navigation
   - Welcome message
   - Quick access to menu
   - Recent orders preview
   
4. CustomerOrders.html
   - Order list with status
   - Reorder button
   - Order details expansion
   - Filter by status
   
5. CustomerMyDiscounts.html
   - Available coupons list
   - Discount details
   - Copy code button
   - Apply button
   - Usage tracking
   
6. CustomerAccountSettings.html
   - Profile tab
   - Password & Security tab
   - Preferences tab
   - Logout section
```

### MODIFIED PAGES (3 Total)
```
1. Home.html
   - Add "Customer Login" button/modal trigger
   - Keep "Admin Login" separate
   - Update CTA to CustomerAuth.html
   
2. QuickOrder.html
   - Add authentication check at top
   - Add user profile dropdown in navbar
   - Add discount banner section
   - Add "Apply Coupon" in cart
   - Show applicable discounts
   
3. Login.html (Optional: Rename to AdminLogin.html)
   - Keep as is for admin/owner login
   - Or enhance with role detection
```

### KEPT PAGES (No Changes)
```
- Admin.html (admin management)
- Owner.html (owner management)
- Receipt.html (order receipt)
- menu.html (menu component)
- orderedList.html (order display)
- paymentMethods.html (payment UI)
```

---

## Service Architecture

### Frontend Services
```
1. AuthService (NEW)
   - register()
   - login()
   - verifyEmail()
   - logout()
   - resetPassword()
   - getProfile()
   - updateProfile()

2. CustomerService (NEW)
   - getOrders()
   - getOrder(id)
   - reorder(orderId)
   - getProfile()

3. DiscountService (NEW)
   - getAvailableDiscounts()
   - getMyDiscounts()
   - validateCode()
   - applyDiscount()
   - getApplicableDiscounts(cartItems)
   - removeDiscount()

4. Modified: ApiService
   - Add customer endpoints
   - Add discount endpoints
   - Update auth endpoints
```

### Backend Services
```
1. EmailService (Enhanced)
   - sendVerificationEmail()
   - sendPasswordResetEmail()
   - sendOrderConfirmationEmail()
   - sendStatusUpdateEmail()
   - sendDiscountNotificationEmail()

2. DiscountService (NEW)
   - validateCode()
   - applyDiscount()
   - calculateSavings()
   - trackUsage()
   - getApplicableDiscounts()

3. CustomerService (NEW)
   - createCustomer()
   - updateProfile()
   - getOrderHistory()
```

---

## User Journey Diagrams

### Registration & Email Verification Flow
```
┌──────────────┐
│ Home.html    │ "Customer Login"
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ CustomerAuth.html        │
│ - Sign Up Tab Selected   │
└──────┬───────────────────┘
       │ Fill form & submit
       ▼
┌──────────────────────────┐
│ Backend: POST /register  │
│ - Hash password          │
│ - Create user (unverified)
│ - Send OTP email         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ EmailVerification.html    │
│ - Enter OTP              │
│ - Resend option          │
└──────┬───────────────────┘
       │ Submit OTP
       ▼
┌──────────────────────────┐
│ Backend: POST /verify    │
│ - Validate OTP           │
│ - Mark user as verified  │
│ - Clear verification token
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Redirect to QuickOrder   │
│ - Logged in automatically│
│ - Can place orders       │
└──────────────────────────┘
```

### Discount Application Flow
```
┌──────────────────────┐
│ QuickOrder.html      │
│ - Browse Menu        │
│ - Add Items to Cart  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Cart Sidebar                 │
│ - Show Cart Total            │
│ - Show Available Discounts   │
│ - Input: Coupon Code         │
└──────┬───────────────────────┘
       │ Enter/Apply Code
       ▼
┌──────────────────────────────┐
│ GET /api/discounts/validate  │
│ - Check code validity        │
│ - Check min order amount     │
│ - Check customer eligibility │
│ - Check usage limits         │
└──────┬───────────────────────┘
       │
       ├─ Valid ────────┐
       │                ▼
       │     ┌──────────────────────┐
       │     │ Apply Discount       │
       │     │ - Show Savings       │
       │     │ - Update Total       │
       │     │ - Button: Proceed    │
       │     └──────┬───────────────┘
       │            │
       │            ▼
       │     ┌──────────────────────┐
       │     │ Checkout Process     │
       │     │ - Discount Applied   │
       │     └──────┬───────────────┘
       │            │
       │            ▼
       │     ┌──────────────────────┐
       │     │ Order Placed         │
       │     │ - Save discount used │
       │     │ - Increment counter  │
       │     │ - Send confirmation  │
       │     └──────────────────────┘
       │
       └─ Invalid ────┐
                      ▼
            ┌──────────────────────┐
            │ Show Error Message   │
            │ - Code expired       │
            │ - Already used limit │
            │ - Order too small    │
            └──────────────────────┘
```

---

## Security & Validation

### Email Verification
```
✓ OTP-based verification (4-6 digits)
✓ Token expiration (15 minutes)
✓ Rate limiting (5 resends/hour)
✓ One-time use only
✓ Audit logging of all attempts
```

### Discount Security
```
✓ Backend validation (not just frontend)
✓ Usage limit enforcement per customer
✓ Code expiration date checking
✓ Minimum order amount validation
✓ One discount per order (configurable)
✓ Audit trail of all applications
✓ Admin-only creation/modification
✓ Prevention of code manipulation
```

### Customer Data
```
✓ JWT authentication for all customer routes
✓ Customer ID matching verification
✓ Password hashing with bcrypt
✓ Email as secondary identifier
✓ Account status validation
✓ Masked data in logs/audit trails
```

---

## Implementation Priorities

### MUST HAVE (MVP)
- Customer Registration & Login
- Email Verification
- Basic Discount Codes
- Apply Discount to Order
- Customer Profile

### SHOULD HAVE (Phase 2)
- Order History
- Customer Dashboard
- Reorder Functionality
- Discount Notifications

### NICE TO HAVE (Phase 3)
- Loyalty Points
- Referral Program
- Automated Discount Campaigns
- Customer Reviews
- Wishlist

---

## Testing Checklist

### Authentication
- [ ] Register with valid email
- [ ] Register with duplicate email (error)
- [ ] Email verification OTP flow
- [ ] OTP expiration
- [ ] Login with correct credentials
- [ ] Login with wrong password
- [ ] Password reset flow

### Discounts
- [ ] Apply valid coupon code
- [ ] Apply expired code (error)
- [ ] Apply code with insufficient order amount
- [ ] Apply code at usage limit (error)
- [ ] Multiple discounts (if supported)
- [ ] Discount calculations accuracy

### Customer Features
- [ ] View order history
- [ ] Reorder previous items
- [ ] Update profile information
- [ ] Change password
- [ ] View available discounts
- [ ] Account logout

### Admin/Discount Management
- [ ] Create discount code
- [ ] Set discount conditions
- [ ] Edit discount
- [ ] Delete discount
- [ ] View discount usage statistics
- [ ] View customer discount assignments

