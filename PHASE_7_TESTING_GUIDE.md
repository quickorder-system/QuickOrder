# Phase 7: End-to-End Testing Guide

**Status:** IN PROGRESS
**Version:** 1.0
**Last Updated:** December 14, 2025

---

## Quick Start

### 1. Setup Test Environment

```bash
# Install dependencies
npm install

# Create test data
npm run setup:test-data

# Create default discounts
npm run setup:discounts

# Start server
npm start
```

### 2. Access Test Accounts

**Application:** http://localhost:3000

**Test Accounts:**
```
Admin:  admin@test.com / Admin123!
Owner:  owner@test.com / Owner123!
SC:     customer.sc@test.com / Pass123!
PWD:    customer.pwd@test.com / Pass123!
Both:   customer.both@test.com / Pass123!
Normal: customer.normal@test.com / Pass123!
```

### 3. Import Postman Collection

1. Open Postman
2. Click "Import"
3. Select `PHASE_7_POSTMAN_COLLECTION.json`
4. Set variables in collection
5. Run requests

---

## Testing Workflows

### Flow 1: Customer SC/PWD Eligibility Claim

**Objective:** Verify customers can claim and persist SC/PWD status

**Steps:**

1. **Login as SC Customer**
   - URL: http://localhost:3000/customerLogin.html
   - Email: `customer.sc@test.com`
   - Password: `Pass123!`
   - Expected: Dashboard loads

2. **Navigate to Profile**
   - Click user icon → Profile
   - Expected: Profile page loads with eligibility section

3. **Claim SC Status**
   - Find "SC/PWD Eligibility" section
   - Check "I am a Senior Citizen"
   - Enter SC ID: `SC-2025-001`
   - Click "Save Profile"
   - Expected: Toast "Profile updated successfully"

4. **Verify Persistence**
   - Refresh page (Ctrl+R)
   - Expected: SC checkbox still checked, ID still shows
   - Check database: `db.users.findOne({ email: "customer.sc@test.com" })`
   - Expected: `customerProfile.isSeniorCitizen = true`

**Pass Criteria:**
- ✅ Profile saves successfully
- ✅ Data persists across refreshes
- ✅ Database reflects changes
- ✅ No console errors

---

### Flow 2: Admin Setup Default Discounts

**Objective:** Verify admin can create SC/PWD discounts

**Steps:**

1. **Login as Admin**
   - URL: http://localhost:3000/Admin.html
   - Email: `admin@test.com`
   - Password: `Admin123!`

2. **Navigate to SC/PWD Eligibility Tab**
   - Click tab button (gift icon, "SC/PWD Eligibility")
   - Expected: Tab content loads with setup section

3. **Configure Discounts**
   - SC Discount %: 25
   - PWD Discount %: 18
   - Year: 2026
   - Click "Setup Default Discounts"
   - Expected: Loading state, then success toast

4. **Verify Discounts Created**
   - Check database:
     ```
     db.discounts.find({ code: /SC-DISCOUNT|PWD-DISCOUNT/ })
     ```
   - Expected: 2 documents with correct values
     - SC: 25%, eligibilityType: "SC"
     - PWD: 18%, eligibilityType: "PWD"

5. **Check Statistics**
   - Scroll to "Usage Statistics" section
   - Expected: 4 stat cards display (SC Users, PWD Users, SC Discounts, PWD Discounts)

**Pass Criteria:**
- ✅ Setup button works
- ✅ Discounts created with correct values
- ✅ Statistics display and count correctly
- ✅ Discounts marked as eligibility-based

---

### Flow 3: Checkout with Automatic Discount

**Objective:** Verify SC customer sees and can apply automatic discount

**Prerequisites:**
- SC customer has claimed SC status (Flow 1 complete)
- Admin has setup discounts (Flow 2 complete)

**Steps:**

1. **Login as SC Customer**
   - Email: `customer.sc@test.com`
   - Password: `Pass123!`

2. **Add Items to Cart**
   - Click "Menu" → Select items (e.g., ₱500 total)
   - Click "Add to Cart" multiple times
   - Go to Cart

3. **Proceed to Checkout**
   - Click "Checkout" or "Place Order"
   - Navigate to orderedList.html (order summary page)
   - Expected: Order summary shows items and subtotal

4. **Find Automatic Discount Card**
   - Scroll to "Available Discounts" section
   - Expected: SC discount card visible showing:
     - Type: "Senior Citizen Discount"
     - Percentage: 25%
     - Estimated savings: ₱125 (for ₱500 order)

5. **Apply Discount**
   - Click "Apply" or "Select" on SC discount card
   - Expected:
     - Card shows "Applied" state
     - Manual code input disabled/hidden
     - Order total updated: ₱500 - ₱125 = ₱375

6. **Complete Order**
   - Proceed through payment
   - Expected: Order completes successfully

7. **Verify Receipt**
   - View receipt/confirmation
   - Expected: Shows "SC Discount: -₱125"
   - Download PDF: Should show discount clearly

**Pass Criteria:**
- ✅ SC discount card appears
- ✅ Correct discount percentage shown
- ✅ Savings calculated correctly
- ✅ Order total recalculates
- ✅ Receipt shows discount
- ✅ No manual code input when auto selected

---

### Flow 4: Customer with Both SC and PWD

**Objective:** Verify both-eligible customer can choose between discounts

**Prerequisites:**
- Both-eligible customer has claimed both statuses
- Admin has setup discounts

**Steps:**

1. **Login as Both Customer**
   - Email: `customer.both@test.com`
   - Password: `Pass123!`

2. **Add Items to Cart**
   - Add items totaling ₱1000
   - Go to checkout

3. **View Both Discount Cards**
   - Expected: Both SC and PWD discount cards visible
   - SC shows: 25% = ₱250 savings
   - PWD shows: 18% = ₱180 savings

4. **Apply SC Discount**
   - Click SC discount card
   - Expected:
     - SC card shows "Applied"
     - PWD card disabled/grayed
     - Total: ₱1000 - ₱250 = ₱750

5. **Switch to PWD Discount**
   - Click PWD discount card
   - Expected:
     - PWD card shows "Applied"
     - SC card disabled/grayed
     - Total: ₱1000 - ₱180 = ₱820

**Pass Criteria:**
- ✅ Both cards visible initially
- ✅ Can apply either discount
- ✅ Can switch between discounts
- ✅ Only one applies at a time
- ✅ Totals calculate correctly for both

---

### Flow 5: Non-Eligible Customer

**Objective:** Verify normal customer doesn't see eligibility discounts

**Steps:**

1. **Login as Normal Customer**
   - Email: `customer.normal@test.com`
   - Password: `Pass123!`

2. **Add Items and Checkout**
   - Add items to cart
   - Go to checkout

3. **Verify No Automatic Discounts**
   - Expected:
     - SC discount card NOT visible
     - PWD discount card NOT visible
     - Manual code input available
     - Can only use manual/promo codes

4. **Try to Apply Manual Code**
   - Enter discount code: `MANUAL-TEST-10`
   - Expected:
     - Code applies successfully
     - Shows 10% discount
     - No SC/PWD discounts visible

**Pass Criteria:**
- ✅ No eligibility discounts visible
- ✅ Manual code entry available
- ✅ Manual codes work correctly
- ✅ No attempts to apply automatic discounts

---

### Flow 6: Admin Verification Workflow

**Objective:** Verify admin can verify and manage eligibility claims

**Steps:**

1. **Login as Admin**
   - Email: `admin@test.com`

2. **Go to SC/PWD Eligibility Tab**
   - Click eligibility tab

3. **Verify Requests Visible**
   - Expected: "Verification Requests" section shows pending requests
   - Cards for SC and PWD verification requests visible

4. **Approve SC Claim**
   - Find SC customer verification card
   - Click "Approve" button
   - Expected:
     - Loading state
     - Success toast
     - Card status changes to "Approved"

5. **View Statistics**
   - Check stat cards
   - Expected: Counts reflect approved/verified status

**Pass Criteria:**
- ✅ Verification requests display
- ✅ Approve/Reject buttons work
- ✅ Status updates reflect
- ✅ Statistics accurate
- ✅ Verified flag updates in database

---

### Flow 7: Owner Panel Same as Admin

**Objective:** Verify owner has same SC/PWD management capabilities

**Steps:**

1. **Login as Owner**
   - Email: `owner@test.com`

2. **Navigate to SC/PWD Tab**
   - Click "SC/PWD Management" tab

3. **Compare with Admin**
   - Verify all sections present:
     - Setup card
     - Statistics cards
     - (Verification requests if owner has access)

4. **Setup Custom Discounts**
   - Change SC %: 22
   - Change PWD %: 17
   - Click setup
   - Expected: Different discounts created vs Admin

**Pass Criteria:**
- ✅ Owner tab exists and functions
- ✅ Setup works for owner
- ✅ Statistics display correctly
- ✅ Feature parity with Admin

---

## API Testing with Postman

### Import Collection

1. Open Postman
2. Click "Import" → Select `PHASE_7_POSTMAN_COLLECTION.json`
3. Set environment variables

### Set Variables

In Postman Collection Variables:

```
base_url: http://localhost:3000
```

After logging in, get tokens from responses and set:

```
admin_token: <token_from_admin_login>
sc_token: <token_from_sc_login>
pwd_token: <token_from_pwd_login>
both_token: <token_from_both_login>
normal_token: <token_from_normal_login>
owner_token: <token_from_owner_login>
```

### Run Test Sequences

**Positive Tests:**
1. Login (all roles)
2. GET Eligible Discounts (SC, PWD, Normal)
3. POST Apply Automatic (SC, PWD)
4. PUT Toggle Preference
5. PUT Update Eligibility
6. POST Setup Discounts (Admin, Owner)
7. GET Statistics

**Expected Results:**
- All requests return 200 or appropriate status
- Response payloads match schema
- Data persists in database

**Negative Tests:**
1. Unauthenticated request → 401
2. Customer setup discounts → 403
3. Non-eligible apply discount → 403

---

## Manual Testing Checklist

### Customer Profile Section
- [ ] SC checkbox toggles SC ID field visibility
- [ ] PWD checkbox toggles PWD ID field visibility
- [ ] Can select both SC and PWD
- [ ] Profile saves without errors
- [ ] Profile persists across refreshes
- [ ] Discount preferences appear
- [ ] Preferences save and persist

### Checkout Flow
- [ ] Eligible discounts load without delays
- [ ] Discount cards display correct percentages
- [ ] Estimated savings calculated correctly
- [ ] Clicking discount applies it
- [ ] Manual code input hides when auto selected
- [ ] Can switch between discounts
- [ ] Order total recalculates correctly

### Admin/Owner Panel
- [ ] Tab visible in navigation
- [ ] Tab content loads completely
- [ ] Setup section has all inputs
- [ ] Setup button is functional
- [ ] Statistics cards display values
- [ ] Values are accurate
- [ ] No console errors

### Edge Cases
- [ ] Disabled discount preference doesn't apply
- [ ] Both-eligible customer can choose either
- [ ] Normal customer sees no eligibility discounts
- [ ] Discount expires after year
- [ ] Offline customer sees cached status
- [ ] Concurrent orders don't conflict

---

## Testing Report Template

```
Date: ________________
Tester: ________________
Environment: ________________ (Dev/Staging/Prod)

Test Case: ________________________________
Expected Result: ________________________________
Actual Result: ________________________________
Status: [ ] PASS  [ ] FAIL  [ ] BLOCKED

Issues Found:
1. ________________________________
2. ________________________________

Notes:
________________________________
```

---

## Common Issues & Troubleshooting

### Issue: Test Data Script Fails

**Solution:**
```bash
# Check MongoDB connection
mongo # or mongosh

# Check if setupTestData.js exists
ls src/seeds/setupTestData.js

# Run directly with node
node src/seeds/setupTestData.js

# Check for bcryptjs dependency
npm list bcryptjs
npm install bcryptjs
```

### Issue: Eligibility Section Not Visible on Profile

**Solution:**
```javascript
// Check in browser console
localStorage.getItem('auth')

// Verify customer service loaded
typeof customerService

// Check database for user eligibility data
db.users.findOne({ email: "customer.sc@test.com" }).customerProfile
```

### Issue: Discount Card Not Appearing at Checkout

**Solution:**
```javascript
// Check if eligible discounts API works
fetch('/api/discounts/eligible-discounts', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(console.log)

// Verify discounts in database
db.discounts.find({ isEligibilityBased: true })

// Check if customer preference enabled
db.users.findOne({ _id: customerId }).discountPreferences
```

### Issue: Browser Console Errors

**Check for:**
- Undefined variables in components
- Failed script loads
- Network errors fetching services
- Missing authorization headers

**Debug:**
```javascript
// In browser console
console.log('Customer Service:', typeof customerService)
console.log('Eligibility Manager:', typeof EligibilityManager)
console.log('Discount Service:', typeof DiscountService)
console.log('Auth Token:', localStorage.getItem('auth'))
```

---

## Performance Benchmarks

**Target Performance:**
- Eligible discounts API: < 200ms
- Discount card render: < 100ms
- Statistics load: < 500ms
- Checkout page load: < 2s total

**Measurement:**
```javascript
// In browser console
performance.mark('start')
// ... perform action
performance.mark('end')
performance.measure('duration', 'start', 'end')
performance.getEntriesByName('duration')[0].duration
```

---

## Test Sign-Off

Upon completion of all workflows and checklists:

- [ ] All positive test flows pass
- [ ] All negative test flows return correct errors
- [ ] All API endpoints respond correctly
- [ ] No console errors in browser
- [ ] Database data consistent
- [ ] Performance meets benchmarks
- [ ] RBAC working correctly
- [ ] Ready for Phase 8 (Deployment)

**Tester Name:** ________________
**Date Completed:** ________________
**Sign-Off:** ________________

---

## Next Steps: Phase 8 - Deployment

Once Phase 7 testing is complete:
1. Code review approval
2. Staging environment deployment
3. UAT (User Acceptance Testing)
4. Production deployment
5. Post-deployment monitoring
