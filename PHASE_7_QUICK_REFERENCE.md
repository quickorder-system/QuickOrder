# 🚀 Phase 7 Testing - Quick Reference Card

**Date:** December 14, 2025  
**Status:** ✅ READY TO TEST  
**Duration:** 5-7 days  
**Effort:** 40-50 hours

---

## Quick Start (5 Minutes)

```bash
# 1. Install & Setup (1 min)
npm install
npm run setup:test-data

# 2. Start Server (30 sec)
npm start

# 3. Login & Begin Testing
Open: http://localhost:3000
Use test accounts below
```

---

## Test Accounts

| Role | Email | Password | Features |
|------|-------|----------|----------|
| **Admin** | admin@test.com | Admin123! | Setup, Verify, Stats |
| **Owner** | owner@test.com | Owner123! | Setup, Stats |
| **SC** | customer.sc@test.com | Pass123! | SC Discount 25% |
| **PWD** | customer.pwd@test.com | Pass123! | PWD Discount 18% |
| **Both** | customer.both@test.com | Pass123! | SC or PWD, Choose One |
| **Normal** | customer.normal@test.com | Pass123! | Manual Codes Only |

---

## Core Testing Workflows

### 1️⃣ Customer Profile (SC/PWD Claim)
```
Login → Dashboard → Profile 
→ Check SC/PWD → Enter ID 
→ Save → Refresh → Verify
```
**Expected:** Data persists, DB updated

### 2️⃣ Admin Setup Discounts
```
Login (Admin) → SC/PWD Tab 
→ Enter Percentages (25%, 18%) 
→ Click Setup
```
**Expected:** SC-DISCOUNT-2026 created (25%), PWD-DISCOUNT-2026 (18%)

### 3️⃣ Checkout with Auto Discount
```
Login (SC) → Add Items (₱500) 
→ Checkout → See SC Discount Card (25%) 
→ Apply → Total: ₱375 ✓
```
**Expected:** Discount applies, total correct

### 4️⃣ Both-Eligible Choice
```
Login (Both) → Add Items (₱1000) 
→ Checkout → Both Cards Visible 
→ Choose SC (₱250) or PWD (₱180)
```
**Expected:** Can switch, only one applies

### 5️⃣ Admin Verification
```
Login (Admin) → SC/PWD Tab 
→ Verification Requests 
→ Approve/Reject → Stats Update
```
**Expected:** Status updates, approved customer eligible

---

## Quick Test Checklist

### Profile Section ✓
- [ ] SC checkbox shows/hides SC ID field
- [ ] PWD checkbox shows/hides PWD ID field
- [ ] Profile saves without errors
- [ ] Data persists after refresh

### Checkout Section ✓
- [ ] Eligible discounts load
- [ ] Correct discount % shown
- [ ] Savings calculated: (Amount × %)
- [ ] Order total recalculates
- [ ] Can't use manual code + auto together

### Admin Panel ✓
- [ ] SC/PWD tab visible
- [ ] Setup works with custom %
- [ ] Statistics show correct counts
- [ ] Verification requests display
- [ ] Approve/Reject buttons work

### Edge Cases ✓
- [ ] Normal customer: No auto discounts
- [ ] Both-eligible: Can choose either
- [ ] Disabled preference: Can't apply
- [ ] Manual codes: Still work normally

---

## API Quick Test (Postman)

### Import Collection
```
Postman → Import → PHASE_7_POSTMAN_COLLECTION.json
```

### Set Variables
```
base_url: http://localhost:3000
sc_token: [from login response]
pwd_token: [from login response]
admin_token: [from login response]
```

### Test Sequence
1. **POST** Login (all roles)
2. **GET** Eligible Discounts
3. **POST** Apply Automatic
4. **PUT** Toggle Preference
5. **POST** Setup (admin)
6. **GET** Statistics

---

## Success Criteria

### Must Pass (100%)
- ✅ Profiles save and persist
- ✅ Automatic discounts apply
- ✅ Order totals calculate correctly
- ✅ Admin can setup discounts
- ✅ No console errors
- ✅ API endpoints respond 200/201

### Should Pass (90%+)
- ✅ Statistics accurate
- ✅ Verification workflow works
- ✅ RBAC enforced (403 errors)
- ✅ Performance < 500ms

### Expected to Pass (80%+)
- ✅ Browser compatibility
- ✅ Mobile responsive
- ✅ Edge cases handled

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Eligibility section missing | Refresh browser, check localStorage |
| Discount card not showing | Verify discount created, check API response |
| Login fails | Clear localStorage, verify account exists |
| API 401 | Re-login, copy token to Postman |
| Total not updating | Refresh page, try different discount |

---

## Test Report

```
Date: ________________
Tester: ________________

✓ Profile Section: [PASS/FAIL]
✓ Checkout Section: [PASS/FAIL]
✓ Admin Panel: [PASS/FAIL]
✓ API Endpoints: [PASS/FAIL]
✓ Edge Cases: [PASS/FAIL]

Issues Found:
1. ________________________
2. ________________________

Ready for Production? [YES/NO]
```

---

## Helpful Links

- **Master Plan:** `IMPLEMENTATION_PLAN_SC_PWD_DISCOUNTS.md`
- **Full Plan:** `PHASE_7_E2E_TESTING_PLAN.md` (50+ test cases)
- **Guide:** `PHASE_7_TESTING_GUIDE.md` (step-by-step)
- **Overview:** `PHASE_7_OVERVIEW.md` (roadmap)
- **Status:** `PROJECT_STATUS_REPORT.md` (metrics)

---

## Testing Timeline

```
Day 1: Setup & API Testing
Day 2: Customer Workflows
Day 3: Discount Setup
Day 4: Checkout Testing
Day 5: Verification & Edge Cases
Day 6: Admin/Owner Features
Day 7: Compatibility & Regression
```

---

## Key Metrics

- **Test Cases:** 50+
- **Test Workflows:** 10
- **API Endpoints:** 6 new + 3 existing
- **Test Accounts:** 6 pre-configured
- **Timeline:** 5-7 days
- **Effort:** 40-50 hours

---

## Next After Testing

✅ Phase 7: E2E Testing (THIS PHASE)  
→ Phase 8: Deployment & Monitoring  
→ Production Launch

---

**Ready? Let's Begin! 🎯**

```bash
npm run setup:test-data && npm start
```

Then visit: http://localhost:3000

Use any test account from the table above to begin!

---

*For detailed procedures, see PHASE_7_TESTING_GUIDE.md*
