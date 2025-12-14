# Implementation Plan: Automatic SC & PWD Discounts

## Feature Overview
Automatically include Senior Citizen (SC) and Person with Disability (PWD) discounts that are:
- Always available for eligible customers
- Pre-populated during checkout (no code entry needed)
- Applied automatically based on customer profile
- Can be toggled on/off by eligible customers

---

## Phase 1: Database & Model Updates

### 1.1 Update User Model
**File:** `/src/models/user.js`

Add customer profile fields to track eligibility:
```javascript
customerProfile: {
    isSeniorCitizen: {
        type: Boolean,
        default: false
    },
    isPWD: {
        type: Boolean,
        default: false
    },
    scId: String,           // Senior Citizen ID number (optional)
    pwdId: String,          // PWD ID number (optional)
    verifiedAt: Date        // When profile was verified/approved
}
```

### 1.2 Update Discount Model
**File:** `/src/models/discount.js`

Add field to mark discounts as automatic/eligibility-based:
```javascript
isEligibilityBased: {
    type: Boolean,
    default: false
},
eligibilityType: {
    type: String,
    enum: ['SC', 'PWD', 'general', null],
    default: null
},
requiresVerification: {
    type: Boolean,
    default: false
}
```

### 1.3 Create Eligibility History Model
**File:** `/src/models/eligibilityVerification.js` (NEW FILE)

Track when SC/PWD discounts are used:
```javascript
eligibilityVerificationSchema = {
    userId: ObjectId,
    discountId: ObjectId,
    type: enum['SC', 'PWD'],
    orderId: ObjectId,
    discountAmount: Number,
    verificationMethod: enum['manual', 'auto', 'document'],
    documentProof: String,    // URL to uploaded ID document
    status: enum['pending', 'approved', 'rejected'],
    verifiedBy: ObjectId,     // Admin who verified
    verifiedAt: Date,
    createdAt: Date
}
```

---

## Phase 2: Backend API Updates

### 2.1 Create SC/PWD Discount Endpoints
**File:** `/src/routes/discounts.js`

**New Routes:**

#### GET `/api/discounts/eligible` 
Returns eligible automatic discounts for current user:
```javascript
// Returns:
{
    discounts: [
        {
            id: "...",
            code: "SC-DISCOUNT-2025",
            description: "Senior Citizen Discount",
            type: "SC",
            discountValue: 20,  // %
            discountType: "percentage"
        },
        {
            id: "...",
            code: "PWD-DISCOUNT-2025",
            description: "PWD Discount",
            type: "PWD",
            discountValue: 15,  // %
            discountType: "percentage"
        }
    ]
}
```

#### POST `/api/discounts/apply-automatic`
Apply automatic SC/PWD discount:
```javascript
// Request:
{
    discountType: 'SC' | 'PWD',
    orderAmount: 1500
}

// Response:
{
    discount: { ... },
    discountAmount: 300,
    isEligible: true
}
```

#### PUT `/api/discounts/toggle-automatic`
Allow customers to toggle SC/PWD discount usage:
```javascript
// Request:
{
    discountType: 'SC' | 'PWD',
    enabled: true | false
}
```

### 2.2 Update Customer Profile Route
**File:** `/src/routes/customers.js`

#### PUT `/api/customers/profile/eligibility`
Allow customers to add SC/PWD info:
```javascript
// Request:
{
    isSeniorCitizen: true | false,
    isPWD: true | false,
    scId: "string",           // Optional
    pwdId: "string"           // Optional
}

// Validates and updates customer profile
```

#### POST `/api/customers/verify-eligibility`
Admin endpoint to verify SC/PWD status (optional):
```javascript
// Request:
{
    customerId: "...",
    type: 'SC' | 'PWD',
    proofDocument: "file"     // Image/PDF of ID
}
```

### 2.3 Update Order & Discount Validation
**File:** `/src/routes/orders.js` & `/src/routes/discounts.js`

Modify validation logic to:
- Check for automatic discounts during order creation
- Pre-select SC/PWD discounts if eligible
- Apply discount without requiring code entry

---

## Phase 3: Frontend Updates

### 3.1 Customer Profile UI
**File:** `/public/customerProfile.html` + `/public/js/customerProfile.js` (if exists) or `/public/js/pages/customerProfile.js`

Add eligibility section:
```html
<div class="eligibility-section">
    <h3>Eligibility Discounts</h3>
    
    <div class="eligibility-checkbox">
        <input type="checkbox" id="scCheckbox">
        <label for="scCheckbox">
            I am a Senior Citizen (60 years old and above)
            <small>20% discount</small>
        </label>
    </div>
    
    <div class="eligibility-checkbox">
        <input type="checkbox" id="pwdCheckbox">
        <label for="pwdCheckbox">
            I have a disability (PWD)
            <small>15% discount</small>
        </label>
    </div>
    
    <div id="idUploadSection" style="display:none;">
        <label>Upload ID for verification:</label>
        <input type="file" id="idDocument" accept="image/*,application/pdf">
        <button id="submitVerification">Submit for Verification</button>
    </div>
    
    <button id="saveEligibilityBtn">Save Profile</button>
</div>
```

### 3.2 Checkout UI Updates
**File:** `/public/QuickOrder.html` + `/public/js/QuickOrder.js`

Add automatic discount section:
```html
<div class="discount-section">
    <h4>Available Discounts</h4>
    
    <!-- Manual discount code input -->
    <div class="manual-discount">
        <input type="text" id="discountCode" placeholder="Enter discount code">
        <button id="applyDiscountBtn">Apply</button>
    </div>
    
    <!-- Auto discounts (SC/PWD) -->
    <div id="automaticDiscounts" class="auto-discounts">
        <!-- Populated dynamically -->
        <!-- Example:
        <label class="discount-option">
            <input type="radio" name="autoDiscount" value="SC">
            <span>Senior Citizen - 20% off</span>
        </label>
        -->
    </div>
    
    <div id="selectedDiscount" class="selected-discount">
        <!-- Shows selected discount -->
    </div>
</div>
```

### 3.3 Update Discount Service
**File:** `/public/js/services/discount.service.js`

Add new methods:
```javascript
// Get eligible automatic discounts
async getEligibleDiscounts() { ... }

// Apply automatic discount
async applyAutomaticDiscount(discountType, orderAmount) { ... }

// Check if customer is eligible for SC/PWD
async checkEligibility() { ... }

// Toggle automatic discount usage
async toggleAutomaticDiscount(type, enabled) { ... }
```

### 3.4 Order Summary Component
**File:** `/public/js/components/orderSummary.component.js` (if exists) or update QuickOrder.js

Show SC/PWD discounts prominently:
```javascript
// Display eligible discounts
// Allow selection between manual code and automatic discounts
// Show applied discount amount
```

---

## Phase 4: Admin/Owner Features

### 4.1 Admin Dashboard - Discount Management
**File:** `/public/Admin.html` + `/public/js/admin.js`

Add SC/PWD discount management:
- View list of SC/PWD discounts
- Create/Edit SC/PWD discounts
- Set eligibility requirements
- Approve/Reject verification requests
- View reports on SC/PWD discount usage

### 4.2 Create SC/PWD Discounts Helper
Create admin function to quickly setup SC/PWD discounts:
```javascript
// Template: 20% for SC, 15% for PWD
// Always active
// No code required (eligibility-based)
// No usage limits
```

---

## Phase 5: Implementation Order

### Step 1: Database Setup
- [ ] Add fields to User model (customerProfile)
- [ ] Add fields to Discount model (isEligibilityBased, eligibilityType, requiresVerification)
- [ ] Create EligibilityVerification model
- [ ] Run migrations

### Step 2: Backend API
- [ ] Create new discount routes (eligible, apply-automatic, toggle-automatic)
- [ ] Update customer profile routes
- [ ] Update order creation logic to include automatic discounts
- [ ] Update discount validation logic

### Step 3: Create Default SC/PWD Discounts
- [ ] Create POST route to seed default SC/PWD discounts
- [ ] Add admin UI button to create default discounts
- OR manually create via MongoDB

### Step 4: Frontend - Customer Profile
- [ ] Update customer profile page with eligibility section
- [ ] Add file upload for ID verification
- [ ] Add save/submit functionality

### Step 5: Frontend - Checkout
- [ ] Update QuickOrder component to show eligible discounts
- [ ] Add radio buttons to select automatic discounts
- [ ] Update discount calculation logic
- [ ] Update order summary display

### Step 6: Admin Features
- [ ] Add admin UI for SC/PWD discount management
- [ ] Add verification review interface
- [ ] Add SC/PWD discount usage reports

### Step 7: Testing & Polish
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation

---

## Phase 6: Key Features

### Auto-Detection on Checkout
When customer views checkout:
1. Fetch eligible discounts from backend
2. If SC/PWD eligible, show in discount options
3. Allow customer to select or enter manual code
4. Apply selected discount automatically

### Verification (Optional)
- Customers can optionally upload SC/PWD ID
- Admin can verify and flag accounts
- Future: Integrate with government databases (if available)

### Eligibility Preferences
Customers can:
- Enable/Disable SC discount usage
- Enable/Disable PWD discount usage
- Choose between multiple eligible discounts
- Manually enter code instead of using auto

### Activity Logging
Track all SC/PWD discount applications for:
- Auditing purposes
- Fraud detection
- Usage reports

---

## Technical Considerations

### Security
- Validate eligibility on backend (don't trust frontend)
- Verify customer identity for SC/PWD claims
- Log all discount applications
- Implement rate limiting on eligibility checks

### Performance
- Cache eligible discounts in localStorage (with TTL)
- Pre-fetch discounts during user login
- Minimize API calls during checkout

### User Experience
- Make eligibility setup optional (not required)
- Clear explanation of SC/PWD benefits
- Easy toggle on/off at checkout
- Show discount savings prominently

### Compliance
- Privacy: Handle ID documents securely
- GDPR/Local: Secure storage of personal data
- Accessibility: Ensure inclusive design

---

## File Summary

**New Files:**
- `/src/models/eligibilityVerification.js` - Verification model
- `/IMPLEMENTATION_PLAN_SC_PWD_DISCOUNTS.md` - This file

**Modified Files:**
- `/src/models/user.js` - Add customerProfile fields
- `/src/models/discount.js` - Add eligibility fields
- `/src/routes/discounts.js` - New eligible/auto endpoints
- `/src/routes/customers.js` - Update profile route
- `/public/customerProfile.html` - Eligibility section
- `/public/js/customerProfile.js` - Profile logic
- `/public/QuickOrder.html` - Discount selection UI
- `/public/js/QuickOrder.js` - Discount logic
- `/public/js/services/discount.service.js` - New service methods
- `/public/Admin.html` - Admin SC/PWD management
- `/public/js/admin.js` - Admin logic

---

## Implementation Progress

### ✅ Phase 1: Database & Model Updates - COMPLETE
- User model: Added `customerProfile` with SC/PWD fields
- Discount model: Added `isEligibilityBased`, `eligibilityType` fields
- Created `EligibilityVerification` model for tracking SC/PWD applications

### ✅ Phase 2: Backend API Endpoints - COMPLETE
- 5 new endpoints in `/src/routes/discounts.js` for eligible/automatic discounts
- 3 new endpoints in `/src/routes/customers.js` for eligibility management
- Proper validation and error handling

### ✅ Phase 3: Seed Script - COMPLETE
- Created `/src/seeds/setupDefaultDiscounts.js` for one-click discount setup
- Default SC discount: 20%, PWD discount: 15%
- Created `/SETUP_DEFAULT_DISCOUNTS.md` with setup instructions

### ✅ Phase 4: Customer Profile UI - COMPLETE
- Added eligibility section to `/public/customerProfile.html`
- SC/PWD checkboxes with optional ID fields
- Discount preferences toggles
- Integration with `customer.service.js`

### ✅ Phase 5: Checkout Automatic Discounts - COMPLETE
- Updated `/public/orderedList.js` to load eligible discounts async
- Added automatic discount card display in checkout UI
- Toggle behavior between manual codes and auto discounts
- Proper conflict prevention

### ✅ Phase 6: Admin SC/PWD Management Tab - COMPLETE
- Added SC/PWD Management tab to `/public/Admin.html`
- Quick Setup section with configurable SC/PWD percentages
- Verification requests display with approval workflow
- Usage Statistics cards showing totals
- `/public/js/components/eligibility-manager.js` created for management logic

### ✅ Phase 6.5: Owner Panel SC/PWD Management Tab - COMPLETE
- Added SC/PWD Management tab to `/public/Owner.html` navigation
- Identical eligibility content div as Admin panel
- EligibilityManager initialized in `owner.js` showTab function
- Required scripts added: `customer.service.js`, `eligibility-manager.js`
- Full feature parity with Admin panel for owner role

### ✅ Phase 7: End-to-End Testing - FRAMEWORK SETUP COMPLETE
- **PHASE_7_E2E_TESTING_PLAN.md** - Comprehensive test plan with 10 workflows covering 50+ test cases
- **PHASE_7_TESTING_GUIDE.md** - Practical testing guide with step-by-step procedures
- **PHASE_7_OVERVIEW.md** - Quick start guide and testing roadmap
- **src/seeds/setupTestData.js** - Test data creation script (test accounts, discounts, verification records)
- **PHASE_7_POSTMAN_COLLECTION.json** - API testing collection with all endpoints
- **package.json updated** - Added `npm run setup:test-data` and `npm run setup:discounts` scripts

#### Testing Scope (Ready to Execute)
✅ 10 comprehensive test workflows  
✅ 50+ individual test cases  
✅ API endpoint validation (6 endpoints)  
✅ Edge case and error scenario testing  
✅ Role-based access control verification  
✅ Data integrity and audit trail validation  
✅ Performance benchmarking  
✅ Browser/device compatibility checking  
✅ Regression testing for existing features  

#### Test Accounts Pre-configured
- Admin: admin@test.com / Admin123!
- Owner: owner@test.com / Owner123!
- Customer SC: customer.sc@test.com / Pass123!
- Customer PWD: customer.pwd@test.com / Pass123!
- Customer Both: customer.both@test.com / Pass123!
- Customer Normal: customer.normal@test.com / Pass123!

#### Testing Roadmap
- **Timeline:** 5-7 Days (40-50 hours total)
- **Execution:** Follow PHASE_7_TESTING_GUIDE.md
- **API Testing:** Use PHASE_7_POSTMAN_COLLECTION.json in Postman
- **Quick Start:** Run `npm run setup:test-data && npm start`

## Next Steps

1. **Phase 7: Execute End-to-End Testing** (5-7 days)
   - Run test data setup script
   - Execute all 10 testing workflows
   - API endpoint validation via Postman
   - Edge case and error scenario testing
   - Performance and compatibility validation
   - Document all issues and sign-off
   
2. **Phase 8: Deployment & Monitoring** (Post-testing)
   - Code review and final approval
   - Staging environment deployment
   - Production deployment
   - Post-deployment monitoring and support

