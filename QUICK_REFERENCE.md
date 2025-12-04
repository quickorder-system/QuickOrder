# Quick Reference - Customer Account & Discount Implementation

## Key Questions Answered

### Q: Will we remove any pages?
**A: NO - No pages will be removed, only modified or created new ones.**

**Action Items:**
- ✅ Keep all existing pages (Admin.html, Owner.html, QuickOrder.html, etc.)
- ✅ Create 6 new customer-focused pages
- ✅ Modify 3 pages (Home.html, QuickOrder.html, optionally Login.html)
- ✅ Enhance 2 services (Email, Activity Logging)

---

### Q: What is the main user flow?
**A: Authentication → Email Verification → Menu Browsing → Apply Discount → Checkout**

**Detailed Flow:**
```
1. User visits Home.html
2. Clicks "Customer Login" → CustomerAuth.html (Sign Up/Sign In)
3. New User: Fills registration form
   - Email, Password, Name, Phone, Address
   - System sends OTP email
   - User enters OTP in EmailVerification.html
   - Account activated
4. User logged in → Redirected to QuickOrder.html
5. Browse menu, add items to cart
6. Review available discounts (shown in cart)
7. Apply coupon code (optional)
8. Proceed to checkout
9. Place order → Get receipt
10. Can view order history anytime in CustomerDashboard.html
```

---

### Q: Where does the discount fit in?
**A: Discount integrates at 3 points:**

1. **Menu Browsing** (QuickOrder.html)
   - Banner showing available discounts
   - "Browse Discounts" button

2. **Cart Summary** (QuickOrder.html - Cart Component)
   - Input field: "Enter coupon code"
   - Display: "You save ₱XXX with this discount"
   - Show applicable discounts based on items

3. **Checkout Process** (Before payment)
   - Confirm discount before order confirmation
   - Show savings breakdown
   - Option to remove discount

4. **Dashboard** (CustomerMyDiscounts.html)
   - View all available discounts for customer
   - Copy coupon code
   - See usage history
   - Check expiry dates

---

### Q: What new database collections are needed?
**A: 2 NEW + 1 MODIFIED**

| Collection | Type | Purpose |
|-----------|------|---------|
| `discounts` | NEW | Stores all discount codes and rules |
| `customerdiscounts` | NEW | Maps customers to their assigned discounts |
| `users` | MODIFIED | Add customer profile fields |

**No changes to:**
- orders (keep as is)
- inventory (keep as is)
- activitylogs (keep as is)

---

### Q: How many new API endpoints?
**A: 15+ NEW endpoints (organized by feature)**

| Feature | Method | Endpoint |
|---------|--------|----------|
| **Customer Auth** | POST | /api/auth/register |
| | POST | /api/auth/send-verification-email |
| | POST | /api/auth/verify-email |
| | POST | /api/auth/resend-verification |
| | POST | /api/auth/forgot-password |
| | POST | /api/auth/reset-password |
| **Customer Profile** | GET | /api/auth/customer-profile |
| | PUT | /api/auth/customer-profile |
| **Customer Orders** | GET | /api/customers/orders |
| | GET | /api/customers/orders/:id |
| | POST | /api/customers/orders/:id/reorder |
| **Discounts (Customer)** | GET | /api/discounts |
| | GET | /api/discounts/validate |
| | POST | /api/discounts/apply |
| | GET | /api/discounts/my-discounts |
| | GET | /api/discounts/applicable |
| **Discounts (Admin)** | POST | /api/discounts/admin |
| | PUT | /api/discounts/admin/:id |
| | DELETE | /api/discounts/admin/:id |
| | GET | /api/discounts/admin/list |

---

### Q: How many new HTML pages?
**A: 6 NEW pages**

| Page | Purpose |
|------|---------|
| CustomerAuth.html | Sign up / Sign in |
| EmailVerification.html | Email OTP verification |
| CustomerDashboard.html | Main customer hub |
| CustomerOrders.html | Order history |
| CustomerMyDiscounts.html | Available coupons |
| CustomerAccountSettings.html | Profile & preferences |

---

### Q: What pages get modified?
**A: 3 pages (modifications only, no removal)**

| Page | Changes |
|------|---------|
| **Home.html** | Add "Customer Login" button → CustomerAuth.html |
| **QuickOrder.html** | Add auth check, user profile dropdown, discount banner |
| **Login.html** | Optional: Rename to AdminLogin.html OR add role detection |

---

### Q: Authentication flow - step by step?

**NEW CUSTOMER:**
```
1. Customer fills registration form in CustomerAuth.html
   - Email, Password, Name, Phone, Address, etc.
2. POST /api/auth/register
   - Validate email not used
   - Hash password
   - Create user (emailVerified = false)
   - Generate OTP token
3. System sends email with OTP code
4. Customer enters OTP in EmailVerification.html
5. POST /api/auth/verify-email with OTP
   - Validate OTP (must match, not expired)
   - Mark user emailVerified = true
   - Clear OTP token
6. Redirect to QuickOrder.html (auto-logged in)
```

**RETURNING CUSTOMER:**
```
1. Customer enters email & password in CustomerAuth.html
2. POST /api/auth/login
   - Find user by email
   - Compare password with hash
   - Check emailVerified = true
   - Generate JWT token
3. Return JWT token to frontend
4. Store token in localStorage
5. Redirect to QuickOrder.html
```

**PASSWORD RESET:**
```
1. Customer clicks "Forgot Password" in CustomerAuth.html
2. Enters email
3. POST /api/auth/forgot-password
   - Find user
   - Generate reset token
   - Send email with reset link
4. Customer clicks link in email
5. POST /api/auth/reset-password with token & new password
   - Validate token
   - Hash new password
   - Update user
6. Redirect to login
```

---

### Q: How does discount validation work?

**Backend Validation (IMPORTANT: Not just frontend):**
```
Customer clicks "Apply Code"
POST /api/discounts/validate?code=WELCOME10

Backend checks:
1. Does code exist? ✓
2. Is code active? ✓
3. Has code expired? ✓ (check endDate)
4. Has customer used this code too many times? ✓
5. Has code been used by everyone already? ✓ (check maxTotalUsage)
6. Is order amount >= minOrderAmount? ✓
7. Are items eligible for this discount? ✓

If all pass → Return discount details
If any fail → Return error with reason
```

**Discount Application:**
```
When order is placed:
- POST /api/orders with discountCode field
- Backend rechecks all validations
- If valid: Save discountId to order
- Increment discount usage counter
- Calculate final total with discount applied
- Log activity: "DISCOUNT_APPLIED"
```

---

### Q: Email verification - how secure?

**Security Measures:**
```
1. OTP Token Generation:
   - Random 6-digit code
   - Generated per registration
   - Unique per user (at time)

2. Expiration:
   - 15 minutes validity
   - Checked on verification attempt
   - Deleted after use

3. Rate Limiting:
   - Max 5 resend requests per hour
   - Prevents abuse/brute force
   - Tracked by email address

4. Audit Trail:
   - Log all verification attempts
   - Log successful verification
   - Log failed attempts with reason

5. Security Headers:
   - HTTPS only
   - Secure cookies if used
   - CORS properly configured
```

---

### Q: How do discounts integrate with orders?

**Order Model (Enhanced):**
```javascript
// Current fields (kept):
{
  customerId: ObjectId,
  items: [...],
  total: number,
  paymentMethod: string,
  paymentStatus: string,
  ...
}

// NEW fields:
{
  discountCode: string (optional),
  discountId: ObjectId (optional),
  discountAmount: number (₱500 or 10%),
  discountPercentage: number (if percentage type),
  originalTotal: number (before discount),
  finalTotal: number (after discount),
  ...
}
```

**Order Calculation:**
```javascript
// Example:
originalTotal = 2500
discountPercentage = 10
discountAmount = originalTotal * (discountPercentage / 100) // 250
finalTotal = originalTotal - discountAmount // 2250

// Or for fixed discount:
discountAmount = 500 (fixed)
finalTotal = 2500 - 500 // 2000
```

---

### Q: Customer data privacy - what to consider?

**Data Protection:**
```
1. Passwords:
   - Hash with bcrypt (cost: 10)
   - Never log/display
   - Require strong password on reset

2. Email:
   - Treat as PII
   - Mask in logs (use***@example.com)
   - Encrypt in database (optional for extra security)

3. Address Data:
   - Only visible to customer & admin/owner
   - Masked in activity logs
   - Not included in public audit trails

4. Verification Tokens:
   - Never display in UI
   - Delete after use
   - Expiration enforced

5. JWT Tokens:
   - Set reasonable expiration (24 hours)
   - Refresh token mechanism (optional)
   - Revocation on logout
```

---

### Q: What gets logged in activity logs?

**New Activity Types:**
```
1. CUSTOMER_REGISTERED
   - Email
   - Timestamp
   - User agent

2. EMAIL_VERIFIED
   - Email
   - Verification method (OTP)
   - Timestamp

3. DISCOUNT_APPLIED
   - Discount code
   - Order ID
   - Amount saved
   - Customer ID

4. DISCOUNT_CREATED (by admin/owner)
   - Discount details
   - Creator ID
   - Timestamp

5. CUSTOMER_ACCOUNT_UPDATED
   - Fields changed (name, phone, address)
   - Old vs new values (masked)
   - Timestamp

6. PASSWORD_CHANGED
   - Change method (reset/self-change)
   - Timestamp
   - (don't log password itself)

7. ORDER_PLACED_BY_CUSTOMER
   - Order ID
   - Total amount
   - Discount applied (yes/no)
   - Timestamp
```

---

### Q: Implementation timeline - realistic?

**Recommended Breakdown:**

| Phase | Duration | What |
|-------|----------|------|
| Phase 1: Backend Setup | 5-6 days | Models, APIs, Services |
| Phase 2: Auth UI & Logic | 5-6 days | CustomerAuth.html, EmailVerification.html |
| Phase 3: Dashboard | 5-6 days | Dashboard, Orders, Settings pages |
| Phase 4: Discounts | 5-6 days | Discount pages, Admin UI |
| Phase 5: Integration | 3-4 days | Connect all pieces, QuickOrder.html mods |
| Testing & Fixes | 3-4 days | Bug fixes, edge cases |
| **TOTAL** | **26-32 days** | **~4-5 weeks** |

---

### Q: Do we need to modify existing pages significantly?

**Home.html: Minimal Changes**
```diff
+ Add button/link to "Customer Login" → triggers CustomerAuth.html modal
+ Keep "Admin Login" separate
+ Update copy/branding if needed
- No layout changes
```

**QuickOrder.html: Moderate Changes**
```diff
+ Add authentication check at page load
  if (!isCustomerLoggedIn) redirect to CustomerAuth.html
+ Add user profile dropdown in navbar
+ Add discount banner showing available offers
+ Add "Apply Coupon" section in cart
+ Show discount savings calculation
- No major layout restructuring
```

**Login.html: OPTION A - Keep As Is**
```
Keep for admin/owner login
Just rename to AdminLogin.html for clarity
```

**Login.html: OPTION B - Enhance With Role Detection**
```
Add radio buttons at top:
- "Admin/Owner Login"
- "Customer Login"
Toggle different forms based on selection
```

---

### Q: What's the recommended approach?

**RECOMMENDATION FOR YOUR SYSTEM:**

1. **DO NOT remove any pages** - Keep all existing functionality intact
2. **DO create 6 new customer pages** - Dedicated customer experience
3. **DO modify 3 existing pages** - Home.html, QuickOrder.html, Login.html → AdminLogin.html
4. **DO implement role-based routing** - Different entry points for customer vs admin/owner
5. **DO implement email verification** - Essential for customer trust
6. **DO implement backend discount validation** - Security critical
7. **DO add comprehensive activity logging** - Audit trail for compliance

**Why this approach:**
- ✅ Zero risk to existing admin/owner functionality
- ✅ Clean separation of concerns
- ✅ Scalable for future features
- ✅ Security best practices
- ✅ Professional UX for customers
- ✅ Maintainability

---

## Quick Checklist - Next Steps

### Before Implementation Starts:
- [ ] Review this plan with team
- [ ] Confirm database structure
- [ ] Confirm API endpoint naming conventions
- [ ] Decide: Keep Login.html or rename to AdminLogin.html?
- [ ] Decide: OTP via email or SMS for verification?
- [ ] Set password requirements/policy
- [ ] Set discount validation rules

### During Implementation:
- [ ] Create database models first
- [ ] Create API endpoints second
- [ ] Create frontend pages/components third
- [ ] Integration and testing last

### Testing:
- [ ] Registration flow end-to-end
- [ ] Email verification with OTP
- [ ] Login/logout functionality
- [ ] Discount application accuracy
- [ ] Permission/authorization checks
- [ ] Activity logging completeness

