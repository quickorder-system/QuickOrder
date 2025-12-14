# Phase 7: End-to-End Testing - Overview & Quick Start

**Status:** ✅ SETUP COMPLETE - Ready to Execute
**Date:** December 14, 2025
**Target:** Comprehensive validation of SC/PWD automatic discount system

---

## What is Phase 7?

Phase 7 is the testing and validation phase for the complete SC (Senior Citizen) & PWD (Person with Disability) automatic discount system. It encompasses:

✅ 10 comprehensive test workflows  
✅ 50+ individual test cases  
✅ API endpoint validation  
✅ Edge case and error scenario testing  
✅ Role-based access control verification  
✅ Data integrity validation  
✅ Performance benchmarking  
✅ Browser compatibility checks  

---

## Quick Start (5 Minutes)

### Step 1: Create Test Data
```bash
npm install          # Ensure all dependencies installed
npm run setup:test-data    # Create test accounts and data
npm run setup:discounts    # Create default SC/PWD discounts
```

**Output:**
```
✅ TEST DATA SETUP COMPLETE

📋 TEST ACCOUNTS CREATED:
Admin Account: admin@test.com / Admin123!
Owner Account: owner@test.com / Owner123!
SC Customer: customer.sc@test.com / Pass123!
PWD Customer: customer.pwd@test.com / Pass123!
Both Eligible: customer.both@test.com / Pass123!
Normal Customer: customer.normal@test.com / Pass123!

💳 TEST DISCOUNTS CREATED:
SC-DISCOUNT-2026: 25%
PWD-DISCOUNT-2026: 18%
MANUAL-TEST-10: 10% (manual code)
```

### Step 2: Start Server
```bash
npm start
# Server running on http://localhost:3000
```

### Step 3: Begin Testing
- **Manual Testing:** Follow PHASE_7_TESTING_GUIDE.md
- **API Testing:** Import PHASE_7_POSTMAN_COLLECTION.json into Postman
- **Test Plan:** Refer to PHASE_7_E2E_TESTING_PLAN.md for detailed workflows

---

## Test Documents Overview

### 1. PHASE_7_E2E_TESTING_PLAN.md
**Comprehensive master test plan with:**

| Section | Coverage |
|---------|----------|
| **Test Workflows 1-10** | 50+ individual test cases |
| **Workflow 1** | Customer SC/PWD eligibility claim (4 scenarios) |
| **Workflow 2** | Admin/Owner setup default discounts (3 scenarios) |
| **Workflow 3** | Checkout with automatic discounts (7 scenarios) |
| **Workflow 4** | Non-eligible customer behavior (2 scenarios) |
| **Workflow 5** | Admin verification workflow (4 scenarios) |
| **Workflow 6** | Owner panel same as Admin (2 scenarios) |
| **Workflow 7** | Receipt and order history (2 scenarios) |
| **Workflow 8** | Edge cases and error scenarios (5 scenarios) |
| **Workflow 9** | API endpoint validation (6 endpoints) |
| **Workflow 10** | Role-based access control (3 scenarios) |
| **Data Integrity Tests** | Database consistency, audit trails |
| **Performance Tests** | Response times, benchmarks |
| **Browser/Device Tests** | Desktop, mobile, tablet compatibility |
| **Regression Tests** | Existing functionality unaffected |

**How to Use:**
1. Read through each workflow
2. Follow step-by-step instructions
3. Verify "Expected Results" match actual results
4. Mark [ ] PASS / [ ] FAIL for each test
5. Document any issues found

---

### 2. PHASE_7_TESTING_GUIDE.md
**Practical testing guide with:**

| Section | Content |
|---------|---------|
| **Quick Start** | 5-minute setup instructions |
| **Test Accounts** | Pre-configured credentials for all roles |
| **7 Main Workflows** | Step-by-step procedures with expected results |
| **API Testing** | Postman collection instructions and setup |
| **Manual Checklist** | Comprehensive checklist for UI testing |
| **Troubleshooting** | Common issues and solutions |
| **Performance Metrics** | Benchmarks and measurement techniques |
| **Test Report Template** | Standardized documentation format |

**How to Use:**
1. Follow Quick Start section (5 mins setup)
2. Test one workflow at a time
3. Use checklist for systematic verification
4. Reference troubleshooting for issues
5. Document results in test report template

---

### 3. src/seeds/setupTestData.js
**Test data creation script:**

```bash
npm run setup:test-data
```

**Creates:**
- ✅ 6 customer accounts (SC, PWD, Both, Normal + extras)
- ✅ 1 admin account
- ✅ 1 owner account
- ✅ 3 discount codes (2 eligibility-based, 1 manual)
- ✅ Eligibility verification records

**Features:**
- Automatic password hashing with bcrypt
- Pre-configured eligibility profiles
- Sample verification records
- Clear console output with credentials

---

### 4. PHASE_7_POSTMAN_COLLECTION.json
**API testing collection with:**

| Group | Requests |
|-------|----------|
| **Authentication** | 6 login requests (all roles) |
| **Eligibility Endpoints** | 6 requests (GET/POST/PUT) |
| **Customer Profile** | 2 update eligibility requests |
| **Admin Setup** | 3 admin-specific requests |
| **Owner Setup** | 2 owner-specific requests |
| **Negative Tests** | 3 error scenario requests |

**Variables Pre-configured:**
```
base_url: http://localhost:3000
admin_token: [from login]
owner_token: [from login]
sc_token: [from login]
pwd_token: [from login]
both_token: [from login]
normal_token: [from login]
```

**How to Use:**
1. Open Postman
2. Click "Import" → Select JSON file
3. Run authentication requests first
4. Copy tokens into collection variables
5. Run test sequences

---

## Testing Roadmap

### Phase 7 - Execution Plan

#### Day 1: Setup & API Testing
- [ ] Run test data setup script
- [ ] Verify all test accounts created
- [ ] Import Postman collection
- [ ] Test all API endpoints
- [ ] Verify response payloads
- [ ] Check database consistency

#### Day 2: Customer Workflows
- [ ] Test SC eligibility claim (Workflow 1.1)
- [ ] Test PWD eligibility claim (Workflow 1.2)
- [ ] Test both SC and PWD (Workflow 1.3)
- [ ] Test preference management (Workflow 1.4)
- [ ] Verify data persistence

#### Day 3: Discount Setup & Statistics
- [ ] Admin setup discounts (Workflow 2.1)
- [ ] Owner setup discounts (Workflow 2.2)
- [ ] Verify statistics display (Workflow 2.3)
- [ ] Test statistics accuracy
- [ ] Compare admin vs owner

#### Day 4: Checkout & Discounts
- [ ] SC customer checkout (Workflow 3.1-3.2)
- [ ] PWD customer checkout (Workflow 3.3)
- [ ] Both-eligible customer (Workflow 3.4-3.5)
- [ ] Disabled preference behavior (Workflow 3.6)
- [ ] Manual vs automatic conflict (Workflow 3.7)

#### Day 5: Edge Cases & Verification
- [ ] Non-eligible customer (Workflow 4.1-4.2)
- [ ] Admin verification (Workflow 5.1-5.4)
- [ ] Owner verification (Workflow 6.1-6.2)
- [ ] Receipt display (Workflow 7.1)
- [ ] Order history (Workflow 7.2)

#### Day 6: Advanced Testing
- [ ] Edge cases (Workflow 8.1-8.5)
- [ ] API negative tests (Workflow 9)
- [ ] RBAC enforcement (Workflow 10)
- [ ] Data integrity (Workflow D.1-D.2)
- [ ] Performance tests (Workflow P.1-P.2)

#### Day 7: Compatibility & Regression
- [ ] Desktop browsers (Chrome, Firefox, Edge, Safari)
- [ ] Mobile/tablet devices
- [ ] Regression tests (existing features)
- [ ] Documentation updates
- [ ] Final sign-off

---

## Success Criteria

### All Test Workflows Pass
- [ ] Workflow 1: Eligibility Claim (4/4 scenarios)
- [ ] Workflow 2: Setup Discounts (3/3 scenarios)
- [ ] Workflow 3: Checkout (7/7 scenarios)
- [ ] Workflow 4: Non-Eligible (2/2 scenarios)
- [ ] Workflow 5: Admin Verification (4/4 scenarios)
- [ ] Workflow 6: Owner Panel (2/2 scenarios)
- [ ] Workflow 7: Receipts (2/2 scenarios)
- [ ] Workflow 8: Edge Cases (5/5 scenarios)
- [ ] Workflow 9: API (6/6 endpoints)
- [ ] Workflow 10: RBAC (3/3 scenarios)

### Quality Metrics
- [ ] 100% of positive tests pass
- [ ] Negative tests return correct errors
- [ ] No console errors in browser
- [ ] Database data consistent
- [ ] Performance within benchmarks
- [ ] All browsers compatible
- [ ] No regressions detected

### Defect Status
- [ ] Critical: 0
- [ ] Major: 0
- [ ] Minor: Documented for follow-up

---

## Test Accounts Cheat Sheet

```
┌─────────────────────────────────────────────┐
│ ADMIN ACCOUNT                               │
├─────────────────────────────────────────────┤
│ Email: admin@test.com                       │
│ Password: Admin123!                         │
│ Role: Admin                                 │
│ Features: All, Setup Discounts, Verify      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ OWNER ACCOUNT                               │
├─────────────────────────────────────────────┤
│ Email: owner@test.com                       │
│ Password: Owner123!                         │
│ Role: Owner                                 │
│ Features: Setup Discounts, View Stats       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SC CUSTOMER (Senior Citizen)                │
├─────────────────────────────────────────────┤
│ Email: customer.sc@test.com                 │
│ Password: Pass123!                          │
│ Status: SC Claimed, Not Verified            │
│ Features: SC Discount 25%                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PWD CUSTOMER (Person with Disability)       │
├─────────────────────────────────────────────┤
│ Email: customer.pwd@test.com                │
│ Password: Pass123!                          │
│ Status: PWD Claimed, Not Verified           │
│ Features: PWD Discount 18%                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ BOTH ELIGIBLE CUSTOMER                      │
├─────────────────────────────────────────────┤
│ Email: customer.both@test.com               │
│ Password: Pass123!                          │
│ Status: SC + PWD Claimed                    │
│ Features: Choose SC (25%) or PWD (18%)      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ NORMAL CUSTOMER (No eligibility)            │
├─────────────────────────────────────────────┤
│ Email: customer.normal@test.com             │
│ Password: Pass123!                          │
│ Status: No SC/PWD                           │
│ Features: Manual codes only                 │
└─────────────────────────────────────────────┘
```

---

## Available Discount Codes

```
SC-DISCOUNT-2026      (Automatic - 25% for SC customers)
PWD-DISCOUNT-2026     (Automatic - 18% for PWD customers)
MANUAL-TEST-10        (Manual code - 10% for anyone)
```

---

## Common Testing Scenarios

### Scenario A: Full SC Customer Journey
1. Login as SC customer → customer.sc@test.com
2. Add items to cart
3. View checkout with SC discount
4. Apply discount
5. Complete order
6. View receipt with discount

**Expected:** Discount applies correctly with 25% savings

### Scenario B: Admin Setup & Verification
1. Login as admin
2. Go to SC/PWD tab
3. Setup discounts (25%, 18%)
4. View statistics
5. See pending verifications
6. Approve SC claim

**Expected:** Discounts created, stats accurate, verification updated

### Scenario C: Comparison Testing (Both Eligible)
1. Login as both-eligible customer
2. Add items (₱1000)
3. Choose SC discount (25% = ₱250)
4. Check total (₱750)
5. Switch to PWD (18% = ₱180)
6. Check total (₱820)

**Expected:** Can switch between discounts, totals correct

### Scenario D: Negative Testing
1. Login as normal customer
2. Try to view SC discount
3. Try manual code instead
4. Verify automatic discounts absent

**Expected:** No eligibility discounts visible, manual codes work

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Test data script fails | Check MongoDB running: `mongosh` |
| Eligibility section missing | Refresh page, check localStorage |
| Discount card not showing | Verify discount setup ran, check API response |
| Login fails | Clear localStorage, verify account created |
| Postman 401 errors | Re-login and update token variables |
| Database looks wrong | Run `npm run setup:test-data` again |

---

## What to Do If Issues Found

### Critical Issues (Blocks Testing)
1. Document exact steps to reproduce
2. Take screenshot/video
3. Check console errors
4. Create bug ticket
5. Skip workflow, continue with others

### Major Issues (Functionality Broken)
1. Document issue in test plan
2. Note expected vs actual behavior
3. Continue testing, document workarounds
4. Create bug ticket
5. Mark workflow as FAIL

### Minor Issues (UI/Polish)
1. Document for reference
2. Continue testing (non-blocking)
3. Create improvement ticket
4. Mark as noted

---

## Next Phase: Phase 8 - Deployment

Upon Phase 7 Completion:
1. ✅ All critical issues resolved
2. ✅ All major tests passed  
3. ✅ Sign-off obtained
4. ➡️ Proceed to Phase 8: Deployment & Monitoring

**Phase 8 Includes:**
- Staging deployment
- Production deployment
- Post-deployment monitoring
- User feedback collection
- Performance monitoring
- Issue support

---

## Key Contacts

**Test Coordination:** Phase 7 Testing Lead
**Issue Reporting:** Create tickets with reproduction steps
**Questions:** Refer to PHASE_7_TESTING_GUIDE.md

---

## Testing Resources

📄 **Documents:**
- PHASE_7_E2E_TESTING_PLAN.md - Complete test plan
- PHASE_7_TESTING_GUIDE.md - Practical guide
- This file - Overview & quick start

📦 **Tools:**
- src/seeds/setupTestData.js - Create test data
- PHASE_7_POSTMAN_COLLECTION.json - API tests

🔧 **Commands:**
```bash
npm run setup:test-data     # Create test data
npm run setup:discounts     # Create discounts
npm start                   # Start server
npm test                    # Run unit tests
```

---

## Estimated Testing Timeline

**Estimated Duration:** 5-7 Days
- Setup & API Testing: 1 day
- User Workflows: 3 days
- Edge Cases & Advanced: 1-2 days
- Compatibility & Sign-off: 1 day

**Effort:** 1-2 testers, ~40-50 hours total

---

## Sign-Off Template

```
Test Completion Certification

Phase: 7 - End-to-End Testing
Test Plan Version: 1.0
Execution Dates: ________________ to ________________

All Workflows Tested: [ ] Yes [ ] No
All Tests Passed: [ ] Yes [ ] No
Critical Issues: 0 [ ] Yes [ ] No
Ready for Production: [ ] Yes [ ] No

Tested By: ________________
Date: ________________

Approved By: ________________
Date: ________________
```

---

## Ready to Begin?

1. ✅ Read this overview (5 mins)
2. ✅ Run setup script (5 mins)
3. ✅ Start server (1 min)
4. ✅ Follow PHASE_7_TESTING_GUIDE.md (5-7 days)
5. ✅ Complete all workflows
6. ✅ Get sign-off
7. ✅ Proceed to Phase 8

**Current Status:** ✅ SETUP COMPLETE - Ready to Test!

---

*Last Updated: December 14, 2025*
*Version: 1.0*
