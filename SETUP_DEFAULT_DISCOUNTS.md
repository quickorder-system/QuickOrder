# Setting Up Default SC/PWD Discounts

This guide explains how to create the default Senior Citizen (SC) and Person with Disability (PWD) discounts in your QuickOrder system.

## Option 1: Using the Seed Script (Recommended)

### Prerequisites
- Node.js installed
- MongoDB running
- `.env` file configured with `MONGODB_URI`
- At least one admin user in the database

### Steps

1. **Run the seed script:**
```bash
node src/seeds/setupDefaultDiscounts.js
```

2. **Expected output:**
```
Connected to MongoDB
Using admin user: admin@quickorder.com as creator
✅ Created SC Discount: SC-DISCOUNT-2026
✅ Created PWD Discount: PWD-DISCOUNT-2026
✅ Default SC/PWD discounts setup completed!
SC Discount: 20% off
PWD Discount: 15% off
Valid from: 1/1/2025 to 12/31/2026
```

## Option 2: Using the API (Admin Only)

### Prerequisites
- Admin account with authentication
- Bearer token from login

### Request

```bash
curl -X POST http://localhost:3000/api/discounts/setup-eligibility-discounts \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "scPercentage": 20,
    "pwdPercentage": 15,
    "startYear": 2025,
    "endYear": 2026
  }'
```

### Response

```json
{
  "message": "Eligibility discounts created successfully",
  "discounts": {
    "sc": {
      "id": "507f1f77bcf86cd799439011",
      "code": "SC-DISCOUNT-2026",
      "description": "Senior Citizen Discount - 20% off on all orders",
      "discountValue": 20
    },
    "pwd": {
      "id": "507f1f77bcf86cd799439012",
      "code": "PWD-DISCOUNT-2026",
      "description": "PWD Discount - 15% off on all orders",
      "discountValue": 15
    }
  }
}
```

## Option 3: Manual MongoDB Entry

If you prefer direct database manipulation:

```javascript
db.discounts.insertMany([
  {
    code: "SC-DISCOUNT-2026",
    description: "Senior Citizen Discount - 20% off on all orders",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    maxUsagePerCustomer: null,
    maxTotalUsage: null,
    currentUsage: 0,
    isActive: true,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2026-12-31"),
    isEligibilityBased: true,
    eligibilityType: "SC",
    requiresVerification: false,
    createdBy: ObjectId("admin_user_id"),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: "PWD-DISCOUNT-2026",
    description: "PWD Discount - 15% off on all orders",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    maxUsagePerCustomer: null,
    maxTotalUsage: null,
    currentUsage: 0,
    isActive: true,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2026-12-31"),
    isEligibilityBased: true,
    eligibilityType: "PWD",
    requiresVerification: false,
    createdBy: ObjectId("admin_user_id"),
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

## Verifying the Setup

### Check via API
```bash
curl -X GET "http://localhost:3000/api/discounts" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

Look for discounts with:
- `code`: `SC-DISCOUNT-*` and `PWD-DISCOUNT-*`
- `isEligibilityBased`: `true`
- `isActive`: `true`

### Check via MongoDB
```javascript
db.discounts.find({
  isEligibilityBased: true,
  eligibilityType: { $in: ["SC", "PWD"] }
})
```

## Customization

If you want to modify the discount percentages or dates:

### Via API:
Pass custom parameters to the setup endpoint:
```bash
curl -X POST http://localhost:3000/api/discounts/setup-eligibility-discounts \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "scPercentage": 25,
    "pwdPercentage": 20,
    "startYear": 2025,
    "endYear": 2027
  }'
```

### Via Seed Script:
Edit `src/seeds/setupDefaultDiscounts.js` and modify:
```javascript
const scDiscount = {
    // ...
    discountValue: 25,  // Change from 20 to 25
    // ...
};

const pwdDiscount = {
    // ...
    discountValue: 20,  // Change from 15 to 20
    // ...
};
```

## Troubleshooting

### "No admin user found"
- Ensure you've created at least one admin user in the database
- Run: `db.users.findOne({ role: "admin" })`

### "Discounts already exist"
- The script checks for duplicates. If you need to recreate them, delete the old ones first:
```javascript
db.discounts.deleteMany({
  code: { $in: ["SC-DISCOUNT-2026", "PWD-DISCOUNT-2026"] }
})
```

### "MONGODB_URI not found"
- Check your `.env` file has `MONGODB_URI` configured
- Or pass it as environment variable:
```bash
MONGODB_URI=mongodb://localhost:27017/quickorder node src/seeds/setupDefaultDiscounts.js
```

## Next Steps

After setting up the default discounts:

1. ✅ **Phase 3 Complete** - Default discounts created
2. **Phase 4** - Build frontend UI for customer profile and checkout
3. **Phase 5** - Add admin features for verification and management
4. **Phase 6** - Test end-to-end workflow

