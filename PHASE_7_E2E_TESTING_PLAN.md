# Phase 7: End-to-End Testing Plan - SC/PWD Discount System

**Status:** IN PROGRESS
**Date Created:** December 14, 2025
**Target Completion:** Phase 7 Complete

---

## Overview

Phase 7 validates the complete SC/PWD automatic discount system through comprehensive end-to-end testing, covering all user flows, API endpoints, edge cases, and integration points.

## Test Scope

### In Scope
✅ Customer eligibility claim workflow  
✅ Automatic discount application at checkout  
✅ Admin/Owner SC/PWD management and verification  
✅ One-click default discount setup  
✅ Discount preference management  
✅ Statistics and reporting  
✅ API endpoint functionality  
✅ Data persistence and integrity  
✅ Role-based access control  
✅ Error scenarios and edge cases  

### Out of Scope
❌ UI/UX design review (completed in Phase 6)  
❌ Performance load testing (future optimization)  
❌ Mobile responsiveness (covered in existing CSS)  
❌ Dark mode compatibility (existing feature)  

---

## Test Environment Setup

### Prerequisites
```bash
# 1. Ensure MongoDB is running
# 2. Clear existing test data
db.users.deleteMany({ email: /test/ })
db.discounts.deleteMany({ code: /TEST|SC-DISCOUNT|PWD-DISCOUNT/ })
db.eligibilityverifications.deleteMany({})

# 3. Start the application
npm start

# 4. Server should be running on http://localhost:3000
```

### Test Accounts to Create
```javascript
// Admin Account
{
  email: "admin@test.com",
  password: "Admin123!",
  role: "admin"
}

// Owner Account
{
  email: "owner@test.com",
  password: "Owner123!",
  role: "owner"
}

// Customer Accounts
{
  email: "customer.sc@test.com",
  password: "Pass123!",
  role: "customer",
  name: "Senior Citizen Test"
}

{
  email: "customer.pwd@test.com",
  password: "Pass123!",
  role: "customer",
  name: "PWD Test"
}

{
  email: "customer.normal@test.com",
  password: "Pass123!",
  role: "customer",
  name: "Normal Customer"
}

{
  email: "customer.both@test.com",
  password: "Pass123!",
  role: "customer",
  name: "Both Eligible"
}
```

---

## Test Workflow 1: Customer Eligibility Claim Flow

### 1.1 SC Eligibility Claim
**Objective:** Customer can claim SC status and save to profile

**Steps:**
1. Login as `customer.sc@test.com`
2. Navigate to Customer Dashboard → Profile
3. Find "SC/PWD Eligibility" section
4. Check "I am a Senior Citizen" checkbox
5. Enter SC ID: "SC-2025-001"
6. Verify PWD checkbox is unchecked
7. Click "Save Profile"

**Expected Results:**
- ✅ Checkbox toggles visibility of SC ID input field
- ✅ Form submits successfully
- ✅ Toast message: "Profile updated successfully"
- ✅ Eligibility section still shows checked SC checkbox on page refresh
- ✅ Database shows: `user.customerProfile.isSeniorCitizen = true`
- ✅ Database shows: `user.customerProfile.scId = "SC-2025-001"`

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 1.2 PWD Eligibility Claim
**Objective:** Customer can claim PWD status and save to profile

**Steps:**
1. Login as `customer.pwd@test.com`
2. Navigate to Customer Dashboard → Profile
3. Find "SC/PWD Eligibility" section
4. Check "I am a Person with Disability" checkbox
5. Enter PWD ID: "PWD-2025-001"
6. Verify SC checkbox is unchecked
7. Click "Save Profile"

**Expected Results:**
- ✅ Checkbox toggles visibility of PWD ID input field
- ✅ Form submits successfully
- ✅ Toast message: "Profile updated successfully"
- ✅ Eligibility section shows PWD checkbox checked on refresh
- ✅ Database shows: `user.customerProfile.isPWD = true`
- ✅ Database shows: `user.customerProfile.pwdId = "PWD-2025-001"`

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 1.3 Both SC and PWD Claim
**Objective:** Customer can claim both SC and PWD status

**Steps:**
1. Login as `customer.both@test.com`
2. Navigate to Customer Dashboard → Profile
3. Check both "Senior Citizen" AND "Person with Disability"
4. Enter SC ID: "SC-2025-002"
5. Enter PWD ID: "PWD-2025-002"
6. Click "Save Profile"

**Expected Results:**
- ✅ Both checkboxes remain checked
- ✅ Both ID fields remain visible with entered values
- ✅ Form submits successfully
- ✅ Eligibility section shows both checkboxes checked on refresh
- ✅ Database shows both flags as true

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 1.4 Discount Preferences Management
**Objective:** Customer can enable/disable discount usage

**Steps:**
1. Login as `customer.sc@test.com` (SC status already claimed)
2. Navigate to Customer Dashboard → Profile
3. Go to "Discount Preferences" section
4. Verify "Use SC Discount" checkbox is checked by default
5. Uncheck "Use SC Discount"
6. Click "Save Profile"
7. Refresh page and verify unchecked state persists

**Expected Results:**
- ✅ Checkboxes default to true when eligibility is claimed
- ✅ Preferences persist after save
- ✅ Preferences persist across page refreshes
- ✅ Database shows: `user.discountPreferences.useSCDiscount = false`

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 2: Automatic Discount Setup (Admin/Owner)

### 2.1 Admin Setup Default Discounts
**Objective:** Admin can create default SC/PWD discounts in one click

**Steps:**
1. Login as `admin@test.com`
2. Navigate to Admin Panel → SC/PWD Eligibility tab
3. Find "Quick Setup" card
4. Change SC Discount % to 25
5. Change PWD Discount % to 18
6. Change Year to 2026
7. Click "Setup Default Discounts" button

**Expected Results:**
- ✅ Form values are configurable
- ✅ Button shows loading state (spinner/disabled)
- ✅ Success toast: "Discounts created successfully"
- ✅ Database contains discount with:
  - Code: `SC-DISCOUNT-2026`
  - Value: `25`
  - Type: `percentage`
  - `isEligibilityBased: true`
  - `eligibilityType: 'SC'`
- ✅ Database contains discount with:
  - Code: `PWD-DISCOUNT-2026`
  - Value: `18`
  - Type: `percentage`
  - `isEligibilityBased: true`
  - `eligibilityType: 'PWD'`

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 2.2 Owner Setup Default Discounts
**Objective:** Owner can create default SC/PWD discounts with same functionality

**Steps:**
1. Login as `owner@test.com`
2. Navigate to Owner Panel → SC/PWD Management tab
3. Find "Quick Setup" card
4. Set SC Discount % to 22
5. Set PWD Discount % to 17
6. Keep Year as 2026
7. Click "Setup Default Discounts" button

**Expected Results:**
- ✅ All same results as Admin
- ✅ Discounts created with Owner's specified values
- ✅ Both SC and PWD discounts are available system-wide

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 2.3 Statistics Display
**Objective:** Statistics cards show accurate eligibility data

**Steps:**
1. Login as `admin@test.com`
2. Navigate to Admin Panel → SC/PWD Eligibility tab
3. Scroll to "Usage Statistics" section
4. Verify 4 stat cards display:
   - Total SC Users (should be 2: customer.sc, customer.both)
   - Total PWD Users (should be 2: customer.pwd, customer.both)
   - SC Discounts Given (should show ₱0 if no orders yet)
   - PWD Discounts Given (should show ₱0 if no orders yet)

**Expected Results:**
- ✅ All 4 stat cards render with icons
- ✅ SC Users count = 2
- ✅ PWD Users count = 2
- ✅ Discount amounts display in ₱ currency format
- ✅ Stats update when tab is clicked (fresh data)

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 3: Checkout & Automatic Discount Application

### 3.1 SC Customer Views Eligible Discounts at Checkout
**Objective:** SC eligible customer sees automatic discount option at checkout

**Steps:**
1. Login as `customer.sc@test.com` (SC status claimed, discount preference enabled)
2. Add item(s) to cart (e.g., ₱500 total)
3. Navigate to Checkout (orderedList.html)
4. Scroll to "Available Discounts" or similar section
5. Verify SC discount card appears with:
   - Label: "Senior Citizen Discount" or similar
   - Value: "25%" (from setup)
   - Estimated savings displayed

**Expected Results:**
- ✅ Discount card renders with SC icon
- ✅ Discount percentage matches created discount
- ✅ Card is prominently displayed
- ✅ Savings amount is calculated: ₱500 × 25% = ₱125

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 3.2 SC Customer Applies Automatic Discount
**Objective:** Customer can click and apply automatic SC discount

**Steps:**
1. Continue from 3.1 scenario
2. Click "Apply" or "Select" button on SC discount card
3. Verify order total is updated
4. Verify discount line shows in order summary
5. Proceed to complete order

**Expected Results:**
- ✅ Discount card shows "Applied" or highlighted state
- ✅ Manual discount code input becomes disabled/hidden
- ✅ Order subtotal: ₱500
- ✅ Discount: -₱125
- ✅ Order total: ₱375
- ✅ Receipt shows discount applied

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 3.3 PWD Customer Applies Automatic Discount
**Objective:** PWD customer can apply PWD automatic discount

**Steps:**
1. Login as `customer.pwd@test.com`
2. Add items to cart (e.g., ₱600 total)
3. Navigate to Checkout
4. Find PWD discount card
5. Click to apply PWD discount

**Expected Results:**
- ✅ PWD discount card appears (if created with 18%)
- ✅ Order subtotal: ₱600
- ✅ Discount: -₱108 (600 × 18%)
- ✅ Order total: ₱492

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 3.4 Both-Eligible Customer Chooses SC Discount
**Objective:** Customer with both SC and PWD can choose which discount to use

**Steps:**
1. Login as `customer.both@test.com`
2. Add items to cart (₱1000 total)
3. Navigate to Checkout
4. Verify both SC and PWD discount cards appear
5. Click to apply SC discount

**Expected Results:**
- ✅ Both discount cards are visible
- ✅ SC discount card shows 25% savings = ₱250
- ✅ PWD discount card shows 18% savings = ₱180
- ✅ Clicking SC applies ₱250 discount
- ✅ PWD card becomes disabled/grayed out
- ✅ Order total: ₱750

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 3.5 Both-Eligible Customer Switches Discount
**Objective:** Customer can switch between applicable discounts

**Steps:**
1. Continue from 3.4 scenario (SC discount applied)
2. Click on PWD discount card
3. Verify switch happens

**Expected Results:**
- ✅ SC discount is unapplied
- ✅ PWD discount is applied instead
- ✅ Order subtotal: ₱1000
- ✅ Discount: -₱180
- ✅ Order total: ₱820

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 3.6 Discount Disabled by Customer Still Shows But Cannot Apply
**Objective:** When customer disables discount preference, they can't apply it

**Steps:**
1. Disable SC discount in customer.sc@test.com profile (uncheck preference)
2. Add items and navigate to checkout
3. Look for SC discount card

**Expected Results:**
- ✅ SC discount card appears but is disabled/grayed out
- ✅ Shows message: "Discount disabled in preferences" or similar
- ✅ Click does not apply discount
- ✅ Customer can re-enable in profile and try again

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 3.7 Manual Code vs Automatic Discount Conflict Prevention
**Objective:** System prevents both manual code and automatic discount usage

**Steps:**
1. Login as `customer.sc@test.com`
2. Add items to cart (₱500)
3. Go to Checkout
4. Apply automatic SC discount
5. Try to enter manual discount code
6. Try to apply both

**Expected Results:**
- ✅ Manual code input is hidden when auto discount selected
- ✅ OR: Manual code is disabled when auto discount applied
- ✅ Can't apply both simultaneously
- ✅ Customer can switch between them but not use both

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 4: Non-Eligible Customer Behavior

### 4.1 Normal Customer Doesn't See Automatic Discounts
**Objective:** Customer without SC/PWD status doesn't see those discounts

**Steps:**
1. Login as `customer.normal@test.com` (no SC/PWD status claimed)
2. Add items to cart
3. Navigate to Checkout
4. Look for automatic discount cards

**Expected Results:**
- ✅ SC discount card NOT visible
- ✅ PWD discount card NOT visible
- ✅ Manual code entry is available
- ✅ Only manual discounts can be applied

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 4.2 Visitor Cannot Access Eligibility Features
**Objective:** Non-logged-in visitor cannot claim SC/PWD status

**Steps:**
1. Logout or access as anonymous user
2. Try to navigate to Customer Profile
3. Try to claim eligibility

**Expected Results:**
- ✅ Redirected to Login page
- ✅ Cannot access profile without authentication
- ✅ Cannot claim eligibility status

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 5: Admin Verification & Management

### 5.1 Admin Views Pending Verification Requests
**Objective:** Admin can see customers claiming SC/PWD status for verification

**Steps:**
1. Login as `admin@test.com`
2. Navigate to Admin Panel → SC/PWD Eligibility tab
3. Look for "Verification Requests" section
4. Should see verification request cards for customers

**Expected Results:**
- ✅ Section exists with title
- ✅ Cards display for each verification request
- ✅ Each card shows:
  - Customer name
  - Eligibility type (SC or PWD)
  - Claim date
  - Status (pending, approved, rejected)
  - Action buttons (approve, reject)

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 5.2 Admin Approves SC Eligibility Claim
**Objective:** Admin can approve customer SC status

**Steps:**
1. Find verification request from `customer.sc@test.com` (SC)
2. Click "Approve" button on card
3. Verify action completes

**Expected Results:**
- ✅ Button shows loading state
- ✅ Success message appears
- ✅ Card status updates to "Approved"
- ✅ Database shows: `eligibilityVerification.status = 'approved'`
- ✅ Database shows: `user.customerProfile.scVerified = true`

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 5.3 Admin Rejects PWD Eligibility Claim
**Objective:** Admin can reject customer PWD claim

**Steps:**
1. Find verification request from `customer.pwd@test.com` (PWD)
2. Click "Reject" button
3. Optional: Enter rejection reason

**Expected Results:**
- ✅ Button shows loading state
- ✅ Reason dialog appears (if implemented)
- ✅ Success message after rejection
- ✅ Card status updates to "Rejected"
- ✅ Database shows: `eligibilityVerification.status = 'rejected'`
- ✅ Customer cannot use discount until re-approved

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 5.4 Admin Filters Verification Requests
**Objective:** Admin can filter requests by type and status

**Steps:**
1. Navigate to Admin Panel → SC/PWD Eligibility → Verification Requests
2. Find filter options (if available)
3. Filter by "Type: SC"
4. Verify only SC requests show
5. Filter by "Status: Pending"
6. Verify only pending requests show

**Expected Results:**
- ✅ Filter controls render
- ✅ Filters work correctly
- ✅ Card list updates based on filters
- ✅ Can combine multiple filters

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 6: Owner Verification & Management

### 6.1 Owner Views Statistics Same as Admin
**Objective:** Owner can see same eligibility statistics as Admin

**Steps:**
1. Login as `owner@test.com`
2. Navigate to Owner Panel → SC/PWD Management tab
3. Compare statistics with Admin panel

**Expected Results:**
- ✅ All 4 stat cards present and matching Admin values
- ✅ SC Users: 2
- ✅ PWD Users: 2
- ✅ Discount totals match

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 6.2 Owner Can Approve/Reject (if permitted)
**Objective:** Owner has same verification capabilities as Admin

**Steps:**
1. Login as `owner@test.com`
2. Check if verification requests section exists
3. Try to approve/reject requests

**Expected Results:**
- ✅ If Owner should have verification access: Operations work same as Admin
- ✅ If Owner should NOT have access: Section not visible or disabled
- **Note:** Clarify Owner verification permissions based on business logic

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 7: Receipt & Order History

### 7.1 Receipt Shows Applied Discount
**Objective:** Order receipt displays SC/PWD discount clearly

**Steps:**
1. Login as `customer.sc@test.com`
2. Complete checkout with SC discount applied
3. View receipt (PDF or on-screen)

**Expected Results:**
- ✅ Receipt shows order items
- ✅ Receipt shows "SC Discount: -₱XXX"
- ✅ Receipt shows final total after discount
- ✅ Discount appears in proper section
- ✅ PDF generates correctly with discount

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 7.2 Order History Shows Discount Used
**Objective:** Order history displays discount information

**Steps:**
1. Login as `customer.sc@test.com`
2. Navigate to Order History
3. Find order with SC discount applied
4. Verify discount info displays

**Expected Results:**
- ✅ Order card/list shows discount applied
- ✅ Shows discount type (SC or PWD)
- ✅ Shows discount amount
- ✅ Clicking order shows full details with discount

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 8: Edge Cases & Error Scenarios

### 8.1 Customer Tries to Claim Invalid SC ID
**Objective:** System validates SC ID format

**Steps:**
1. Login as `customer.sc@test.com`
2. Go to Profile
3. Enter invalid SC ID (if validation exists)
4. Try to save

**Expected Results:**
- ✅ If validation: Error message appears, profile not saved
- ✅ If no validation: Accepts any value (document requirement)
- **Note:** Clarify validation requirements

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 8.2 Duplicate Discount Code Handling
**Objective:** System handles duplicate discount codes properly

**Steps:**
1. Admin creates SC-DISCOUNT-2026 with 25%
2. Try to create another SC-DISCOUNT-2026 with 30%
3. Verify behavior

**Expected Results:**
- ✅ Either: Error message "Discount code already exists"
- ✅ Or: Updates existing discount (if intended)
- ✅ No silent failure

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 8.3 Discounts Expire at Year End
**Objective:** Old year discounts don't apply after year changes

**Steps:**
1. Create discounts for year 2025
2. Manually set system date to Jan 1, 2026
3. Try to apply 2025 discount
4. Try to apply 2026 discount

**Expected Results:**
- ✅ 2025 discount unavailable in 2026
- ✅ 2026 discount available
- ✅ Clear cutoff behavior

**Note:** May need to revisit this based on business logic

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 8.4 Offline Eligibility Access
**Objective:** Cached eligibility data works when connectivity is poor

**Steps:**
1. Login and load customer profile (SC status)
2. Disable network (DevTools)
3. Try to view cached eligibility status
4. Re-enable network

**Expected Results:**
- ✅ Cached data persists in localStorage
- ✅ Customer can still view claimed status
- ✅ Checkout can show cached discounts
- ✅ New orders sync when online

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 8.5 Concurrent Order Placement
**Objective:** Multiple simultaneous orders process discounts correctly

**Steps:**
1. Open 2 browser windows with same customer (customer.sc@test.com)
2. Window 1: Add items, start checkout
3. Window 2: Add different items, start checkout
4. Both apply SC discount simultaneously
5. Complete both orders

**Expected Results:**
- ✅ Both orders complete successfully
- ✅ Both discounts applied correctly
- ✅ Statistics reflect both discounts
- ✅ No data corruption

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 9: API Endpoint Validation

### 9.1 GET /api/discounts/eligible-discounts
**Objective:** Endpoint returns eligible discounts for authenticated customer

**Test Type:** API Testing (Postman/cURL)

**Request:**
```
GET /api/discounts/eligible-discounts
Authorization: Bearer <SC_CUSTOMER_TOKEN>
```

**Expected Response (200):**
```json
{
  "success": true,
  "discounts": [
    {
      "_id": "...",
      "code": "SC-DISCOUNT-2026",
      "description": "Senior Citizen Discount",
      "isEligibilityBased": true,
      "eligibilityType": "SC",
      "discountValue": 25,
      "discountType": "percentage"
    }
  ]
}
```

**Test Cases:**
- [ ] SC customer gets SC discount
- [ ] PWD customer gets PWD discount
- [ ] Both-eligible customer gets both
- [ ] Normal customer gets empty array
- [ ] Unauthenticated returns 401
- [ ] Response time < 200ms

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 9.2 POST /api/discounts/apply-automatic
**Objective:** Apply automatic discount and calculate amount

**Request:**
```json
POST /api/discounts/apply-automatic
Authorization: Bearer <SC_CUSTOMER_TOKEN>
{
  "discountType": "SC",
  "orderAmount": 500
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "discount": { ... },
  "discountAmount": 125,
  "newTotal": 375,
  "isEligible": true
}
```

**Test Cases:**
- [ ] SC customer can apply SC discount
- [ ] Calculation correct: 500 × 25% = 125
- [ ] New total correct: 500 - 125 = 375
- [ ] PWD customer cannot apply SC (403 or isEligible: false)
- [ ] Non-customer cannot apply (401)

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 9.3 PUT /api/discounts/toggle-automatic
**Objective:** Enable/disable discount preference

**Request:**
```json
PUT /api/discounts/toggle-automatic
Authorization: Bearer <SC_CUSTOMER_TOKEN>
{
  "discountType": "SC",
  "enabled": false
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Discount preference updated",
  "preferences": {
    "useSCDiscount": false,
    "usePWDDiscount": true
  }
}
```

**Test Cases:**
- [ ] Preference toggles correctly
- [ ] Persistence across requests
- [ ] Returns updated preferences object
- [ ] Invalid discountType returns 400

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 9.4 PUT /api/customers/profile/eligibility
**Objective:** Update customer eligibility status

**Request:**
```json
PUT /api/customers/profile/eligibility
Authorization: Bearer <CUSTOMER_TOKEN>
{
  "isSeniorCitizen": true,
  "scId": "SC-2025-001",
  "isPWD": false,
  "pwdId": ""
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

**Test Cases:**
- [ ] SC status updates
- [ ] PWD status updates
- [ ] IDs save correctly
- [ ] Customer can update own profile
- [ ] Non-owner cannot update others (403)
- [ ] Admin can update others (if permitted)

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 9.5 POST /api/discounts/setup-eligibility-discounts
**Objective:** Create default SC/PWD discounts

**Request:**
```json
POST /api/discounts/setup-eligibility-discounts
Authorization: Bearer <ADMIN_TOKEN>
{
  "scPercentage": 25,
  "pwdPercentage": 18,
  "year": 2026
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Discounts created successfully",
  "discounts": [
    { "code": "SC-DISCOUNT-2026", "value": 25 },
    { "code": "PWD-DISCOUNT-2026", "value": 18 }
  ]
}
```

**Test Cases:**
- [ ] Admin can setup discounts
- [ ] Owner can setup discounts
- [ ] Customer cannot (403)
- [ ] Discounts created with correct values
- [ ] Discounts marked as eligibility-based
- [ ] Can override existing discounts (if intended)

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 9.6 GET /api/discounts/eligibility-stats
**Objective:** Get SC/PWD usage statistics

**Request:**
```
GET /api/discounts/eligibility-stats
Authorization: Bearer <ADMIN_TOKEN>
```

**Expected Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalSCUsers": 2,
    "totalPWDUsers": 2,
    "totalSCDiscountsGiven": 125.50,
    "totalPWDDiscountsGiven": 98.25,
    "topEligibleCustomers": [...],
    "discountBreakdown": { ... }
  }
}
```

**Test Cases:**
- [ ] Accurate user counts
- [ ] Correct discount totals
- [ ] Only admin/owner can access (401 for others)
- [ ] Response time < 500ms
- [ ] Data matches database

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Test Workflow 10: Role-Based Access Control (RBAC)

### 10.1 Customer Cannot Access Admin Features
**Objective:** Customers cannot access admin/owner functions

**Test Cases:**
- [ ] Cannot access Admin Panel URL
- [ ] Cannot call admin-only API endpoints
- [ ] Cannot access eligibility verification
- [ ] Cannot setup default discounts
- [ ] Can only manage own profile

**Expected Results:**
- ✅ Redirected to appropriate page
- ✅ API returns 403 Forbidden
- ✅ Features hidden in UI
- ✅ Error messages displayed

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 10.2 Owner Cannot Access Admin-Only Features
**Objective:** Owner has limited admin capabilities

**Test Cases:**
- [ ] Can access Owner Panel
- [ ] Can see statistics
- [ ] Can setup discounts
- [ ] Can/Cannot verify eligibility (clarify business logic)
- [ ] Cannot delete discounts
- [ ] Cannot modify other owner's data

**Expected Results:**
- ✅ Clear separation of capabilities
- ✅ Appropriate error messages
- ✅ UI reflects permissions

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### 10.3 Admin Has Full Access
**Objective:** Admin can perform all operations

**Test Cases:**
- [ ] Can access Admin Panel
- [ ] Can create discounts
- [ ] Can verify eligibility claims
- [ ] Can view statistics
- [ ] Can modify customer profiles
- [ ] Can view all data

**Expected Results:**
- ✅ No restrictions on admin functions
- ✅ Can modify system-wide settings

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Data Integrity Tests

### D.1 Database Consistency
**Objective:** Data remains consistent across all operations

**Test Steps:**
1. Create customers with SC/PWD status
2. Create discounts
3. Place orders with discounts
4. Verify database:
   - User documents have correct eligibility flags
   - Discount documents marked as eligibility-based
   - EligibilityVerification records created
   - Order documents show discount applied

**Expected Results:**
- ✅ No orphaned records
- ✅ All relationships intact
- ✅ No data corruption
- ✅ Cascading deletes work (if applicable)

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### D.2 Audit Trail
**Objective:** All actions are logged for compliance

**Test Steps:**
1. Customer claims eligibility
2. Admin approves/rejects
3. Customer applies discount
4. Check activity logs

**Expected Results:**
- ✅ All actions recorded with timestamp
- ✅ User information logged
- ✅ Changes tracked for audit
- ✅ Cannot be altered retroactively

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Performance Tests

### P.1 Eligibility Check Performance
**Objective:** Eligibility checking doesn't slow down checkout

**Test Steps:**
1. Load checkout page with 1000 discounts
2. Measure load time for eligible discounts API
3. Measure rendering time

**Expected Results:**
- ✅ API response < 200ms
- ✅ DOM rendering < 100ms
- ✅ Total load < 500ms
- ✅ No UI freezing

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### P.2 Statistics Calculation Performance
**Objective:** Statistics don't create performance bottlenecks

**Test Steps:**
1. 10,000 orders with discounts applied
2. Load admin statistics page
3. Measure load time

**Expected Results:**
- ✅ Page loads < 1 second
- ✅ Statistics calculated < 500ms
- ✅ Database queries optimized

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Browser/Device Compatibility

### C.1 Desktop Browsers
**Test on:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)

**Verify:**
- [ ] All UI elements render correctly
- [ ] Forms submit properly
- [ ] No console errors
- [ ] Responsive at 1920x1080

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

### C.2 Mobile/Tablet
**Test on:**
- [ ] iPhone (iOS 15+)
- [ ] Android device (Android 10+)
- [ ] iPad

**Verify:**
- [ ] Touch interactions work
- [ ] Layout responsive
- [ ] Buttons appropriately sized
- [ ] No horizontal scroll

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Regression Tests

### R.1 Existing Functionality Not Broken
**Test Cases:**
- [ ] Manual discount codes still work
- [ ] Regular checkout flow unaffected
- [ ] Admin panel other tabs functional
- [ ] Customer profile other sections work
- [ ] Reports still generate
- [ ] Activity logs still recorded

**Expected Results:**
- ✅ No regressions introduced
- ✅ All existing features still work

**Test Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________

---

## Sign-Off

### Test Summary
| Area | Passed | Failed | Blocked |
|------|--------|--------|---------|
| Customer Eligibility | [ ] | [ ] | [ ] |
| Checkout & Discounts | [ ] | [ ] | [ ] |
| Admin/Owner Setup | [ ] | [ ] | [ ] |
| Verification Workflow | [ ] | [ ] | [ ] |
| API Endpoints | [ ] | [ ] | [ ] |
| RBAC | [ ] | [ ] | [ ] |
| Data Integrity | [ ] | [ ] | [ ] |
| Performance | [ ] | [ ] | [ ] |
| Compatibility | [ ] | [ ] | [ ] |
| Regression | [ ] | [ ] | [ ] |

### Critical Issues Found
1. ___________________________
2. ___________________________
3. ___________________________

### Minor Issues Found
1. ___________________________
2. ___________________________

### Test Completed By
**Name:** ________________
**Date:** December 14, 2025 - ________
**Duration:** ________ hours

### Approval for Production
- [ ] All critical issues resolved
- [ ] All major tests passed
- [ ] Ready for Phase 8 (Deployment)

**Approved By:** ________________
**Date:** ________________

---

## Next Phase: Phase 8 - Deployment & Monitoring

Upon Phase 7 completion:
1. Code review and final approval
2. Database migration (if needed)
3. Staging environment deployment
4. Production deployment
5. Monitoring and support
